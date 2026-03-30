import { Modal, Notice, Setting, type App } from "obsidian";
import { installSkill, VALID_AGENTS, TOOL_TO_AGENT, type MarketplaceSkill } from "../marketplace";
import { getInstalledTools } from "../scanner";
import type { ChopsSettings } from "../types";

export class InstallSkillModal extends Modal {
	private skill: MarketplaceSkill;
	private settings: ChopsSettings;
	private onInstalled: () => void;
	private selectedAgents = new Set<string>();
	private isGlobal = false;

	constructor(app: App, skill: MarketplaceSkill, settings: ChopsSettings, onInstalled: () => void) {
		super(app);
		this.skill = skill;
		this.settings = settings;
		this.onInstalled = onInstalled;

		const installed = getInstalledTools();
		for (const toolId of installed) {
			const agentName = TOOL_TO_AGENT[toolId];
			if (agentName) this.selectedAgents.add(agentName);
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("as-install-modal");

		contentEl.createEl("h3", { text: `Install ${this.skill.name}` });
		contentEl.createEl("p", {
			cls: "as-install-source",
			text: this.skill.source,
		});

		new Setting(contentEl).setName("Agents").setHeading();

		const installed = getInstalledTools();
		const installedAgentIds = new Set(
			installed.map((id) => TOOL_TO_AGENT[id]).filter(Boolean)
		);

		for (const agent of VALID_AGENTS) {
			const isInstalled = installedAgentIds.has(agent.id);
			new Setting(contentEl)
				.setName(agent.label)
				.setDesc(isInstalled ? "Detected" : "")
				.addToggle((toggle) =>
					toggle
						.setValue(this.selectedAgents.has(agent.id))
						.onChange((value) => {
							if (value) {
								this.selectedAgents.add(agent.id);
							} else {
								this.selectedAgents.delete(agent.id);
							}
						})
				);
		}

		new Setting(contentEl).setName("Scope").setHeading();

		new Setting(contentEl)
			.setName("Install globally")
			.setDesc("Install to ~/.agents/skills/ instead of project-level")
			.addToggle((toggle) =>
				toggle.setValue(this.isGlobal).onChange((value) => {
					this.isGlobal = value;
				})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText("Install")
					.setCta()
					.onClick(() => this.doInstall(btn.buttonEl))
			);
	}

	private doInstall(btnEl: HTMLButtonElement): void {
		const agents = [...this.selectedAgents];
		if (agents.length === 0) {
			new Notice("Select at least one agent", 5000);
			return;
		}

		btnEl.setText("Installing...");
		btnEl.disabled = true;

		setTimeout(() => {
			const result = installSkill(this.skill.source, agents, {
				runner: this.settings.packageRunner,
				global: this.isGlobal,
			});

			if (result.success) {
				new Notice(`Installed ${this.skill.name}`, 5000);
				this.skill.installed = true;
				this.onInstalled();
				this.close();
			} else {
				new Notice(`Failed: ${result.output.slice(0, 200)}`, 5000);
				btnEl.setText("Install");
				btnEl.disabled = false;
			}
		}, 10);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
