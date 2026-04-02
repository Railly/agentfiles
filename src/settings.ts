import { PluginSettingTab, Setting, type App } from "obsidian";
import { TOOL_CONFIGS } from "./tool-configs";
import type AgentfilesPlugin from "./main";

export class AgentfilesSettingTab extends PluginSettingTab {
	plugin: AgentfilesPlugin;

	constructor(app: App, plugin: AgentfilesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("File watching")
			.setDesc("Automatically detect changes to skill files")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.watchEnabled)
					.onChange(async (value) => {
						this.plugin.settings.watchEnabled = value;
						await this.plugin.saveSettings();
						this.plugin.restartWatcher();
					})
			);

		new Setting(containerEl)
			.setName("Watch debounce (ms)")
			.setDesc("Delay before re-scanning after file changes")
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.watchDebounceMs))
					.onChange(async (value) => {
						const n = parseInt(value);
						if (!isNaN(n) && n >= 100) {
							this.plugin.settings.watchDebounceMs = n;
							await this.plugin.saveSettings();
						}
					})
			);

		new Setting(containerEl)
			.setName("Display names")
			.setDesc("How skill and command names are displayed in the list")
			.addDropdown((drop) =>
				drop
					.addOptions({
						auto: "Auto (frontmatter / heading / filename)",
						filename: "Filename only",
					})
					.setValue(this.plugin.settings.namingMode || "auto")
					.onChange(async (value) => {
						this.plugin.settings.namingMode = value as "auto" | "filename";
						await this.plugin.saveSettings();
						this.plugin.refreshStore();
					})
			);

		new Setting(containerEl).setName("Marketplace").setHeading();

		new Setting(containerEl)
			.setName("Package runner")
			.setDesc("Command used to install skills from the marketplace")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({ auto: "Auto-detect", npx: "npx", bunx: "bunx" })
					.setValue(this.plugin.settings.packageRunner)
					.onChange(async (value) => {
						this.plugin.settings.packageRunner = value as "auto" | "npx" | "bunx";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Project scanning").setHeading();

		new Setting(containerEl)
			.setName("Scan projects")
			.setDesc(
				"Scan all directories under the projects home folder for project-level skills"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.projectScanEnabled)
					.onChange(async (value) => {
						this.plugin.settings.projectScanEnabled = value;
						await this.plugin.saveSettings();
						this.plugin.refreshStore();
						this.plugin.restartWatcher();
					})
			);

		new Setting(containerEl)
			.setName("Projects home directory")
			.setDesc(
				"Root directory to scan for project-level skills. Leave empty for home directory (~)."
			)
			.addText((text) =>
				text
					.setPlaceholder("~")
					.setValue(this.plugin.settings.projectsHomeDir)
					.onChange(async (value) => {
						this.plugin.settings.projectsHomeDir = value;
						await this.plugin.saveSettings();
						this.plugin.refreshStore();
						this.plugin.restartWatcher();
					})
			);

		new Setting(containerEl).setName("Tools").setHeading();

		for (const tool of TOOL_CONFIGS) {
			const installed = tool.isInstalled();
			const toolSettings = this.plugin.settings.tools[tool.id] || {
				enabled: true,
				customPaths: [],
			};

			new Setting(containerEl)
				.setName(tool.name)
				.setDesc(installed ? "Installed" : "Not detected")
				.addToggle((toggle) =>
					toggle
						.setValue(installed && toolSettings.enabled)
						.setDisabled(!installed)
						.onChange(async (value) => {
							this.plugin.settings.tools[tool.id] = {
								...toolSettings,
								enabled: value,
							};
							await this.plugin.saveSettings();
							this.plugin.refreshStore();
						})
				);
		}
	}
}
