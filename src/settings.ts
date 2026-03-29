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

		new Setting(containerEl).setName("Agentfiles").setHeading();

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

		new Setting(containerEl).setName("Project scanning").setHeading();

		new Setting(containerEl)
			.setName("Enable project scanning")
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
