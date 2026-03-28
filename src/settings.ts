import { PluginSettingTab, Setting, type App } from "obsidian";
import { basename } from "path";
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

		new Setting(containerEl).setName("Projects").setHeading();

		new Setting(containerEl)
			.setName("Project directories")
			.setDesc(
				"Add project directories to scan for project-level skills, commands, rules, and agents. " +
				"Depth controls how many levels deep to search for projects."
			)
			.addButton((btn) =>
				btn.setButtonText("Add project").onClick(async () => {
					const { remote } = require("electron");
					const result = await remote.dialog.showOpenDialog({
						properties: ["openDirectory"],
						title: "Select a project directory",
					});
					if (result.canceled || result.filePaths.length === 0) return;
					const dir = result.filePaths[0];
					const exists = this.plugin.settings.projectPaths.some(
						(e) => e.path === dir
					);
					if (!exists) {
						this.plugin.settings.projectPaths.push({ path: dir, depth: 1 });
						await this.plugin.saveSettings();
						this.plugin.refreshStore();
						this.plugin.restartWatcher();
						this.display();
					}
				})
			);

		for (const entry of this.plugin.settings.projectPaths) {
			new Setting(containerEl)
				.setName(basename(entry.path))
				.setDesc(entry.path)
				.addDropdown((drop) =>
					drop
						.addOptions({ "0": "0 (exact)", "1": "1", "2": "2", "3": "3" })
						.setValue(String(entry.depth))
						.onChange(async (value) => {
							entry.depth = parseInt(value);
							await this.plugin.saveSettings();
							this.plugin.refreshStore();
							this.plugin.restartWatcher();
						})
				)
				.addButton((btn) =>
					btn
						.setButtonText("Remove")
						.setWarning()
						.onClick(async () => {
							this.plugin.settings.projectPaths =
								this.plugin.settings.projectPaths.filter(
									(e) => e.path !== entry.path
								);
							await this.plugin.saveSettings();
							this.plugin.refreshStore();
							this.plugin.restartWatcher();
							this.display();
						})
				);
		}

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
