import { Modal, Notice, Setting, type App } from "obsidian";
import { installSkillAsync, VALID_AGENTS, TOOL_TO_AGENT, type MarketplaceSkill } from "../marketplace";
import { getInstalledTools } from "../scanner";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import type { ChopsSettings } from "../types";

const AGENT_TO_TOOL: Record<string, string> = {};
for (const [toolId, agentId] of Object.entries(TOOL_TO_AGENT)) {
	if (!AGENT_TO_TOOL[agentId]) AGENT_TO_TOOL[agentId] = toolId;
}

let lastSelectedAgents: Set<string> | null = null;
let lastIsGlobal = true;

export class InstallSkillModal extends Modal {
	private skill: MarketplaceSkill;
	private settings: ChopsSettings;
	private onInstalled: () => void;
	private selectedAgents: Set<string>;
	private isGlobal: boolean;

	constructor(app: App, skill: MarketplaceSkill, settings: ChopsSettings, onInstalled: () => void) {
		super(app);
		this.skill = skill;
		this.settings = settings;
		this.onInstalled = onInstalled;

		if (lastSelectedAgents) {
			this.selectedAgents = new Set(lastSelectedAgents);
		} else {
			this.selectedAgents = new Set<string>();
			const installed = getInstalledTools();
			for (const toolId of installed) {
				const agentName = TOOL_TO_AGENT[toolId];
				if (agentName) this.selectedAgents.add(agentName);
			}
		}
		this.isGlobal = lastIsGlobal;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("as-install-modal");

		contentEl.createEl("h3", { text: `Install ${this.skill.name}` });
		contentEl.createEl("p", {
			cls: "as-install-source",
			text: this.skill.source,
		});

		new Setting(contentEl)
			.setName("Install globally")
			.setDesc("Shared across all projects (~/.agents/skills/)")
			.addToggle((toggle) =>
				toggle.setValue(this.isGlobal).onChange((value) => {
					this.isGlobal = value;
				})
			);

		new Setting(contentEl).setName("Agents").setHeading();

		const scrollArea = contentEl.createDiv("as-install-scroll");

		const installed = getInstalledTools();
		const installedAgentIds = new Set(
			installed.map((id) => TOOL_TO_AGENT[id]).filter(Boolean)
		);

		for (const agent of VALID_AGENTS) {
			const isInstalled = installedAgentIds.has(agent.id);
			const toolId = AGENT_TO_TOOL[agent.id];
			const setting = new Setting(scrollArea)
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

			const nameEl = setting.nameEl;
			const iconKey = (toolId && TOOL_SVGS[toolId]) ? toolId
				: TOOL_SVGS[agent.id] ? agent.id
				: TOOL_SVGS[agent.id + "-code"] ? agent.id + "-code"
				: TOOL_SVGS[agent.id + "-cli"] ? agent.id + "-cli"
				: null;
			const iconSpan = nameEl.createSpan("as-install-agent-icon");
			if (iconKey) {
				renderToolIcon(iconSpan, iconKey, 14);
			} else {
				iconSpan.addClass("as-install-agent-placeholder");
			}
			nameEl.createSpan({ text: agent.label });
			if (isInstalled) {
				nameEl.createSpan({ cls: "as-install-detected", text: "detected" });
			}
		}

		const footer = contentEl.createDiv("as-install-footer");
		const cancelBtn = footer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());
		const installBtn = footer.createEl("button", { cls: "mod-cta", text: "Install" });
		installBtn.addEventListener("click", () => this.doInstall(installBtn));
	}

	private doInstall(btnEl: HTMLButtonElement): void {
		const agents = [...this.selectedAgents];
		if (agents.length === 0) {
			new Notice("Select at least one agent", 5000);
			return;
		}

		lastSelectedAgents = new Set(this.selectedAgents);
		lastIsGlobal = this.isGlobal;

		this.close();
		new Notice(`Installing ${this.skill.name}...`, 3000);

		void installSkillAsync(this.skill.source, agents, {
			runner: this.settings.packageRunner,
			global: this.isGlobal,
		}).then((result) => {
			if (result.success) {
				new Notice(`Installed ${this.skill.name}`, 5000);
				this.skill.installed = true;
				this.onInstalled();
			} else {
				new Notice(`Failed to install ${this.skill.name}`, 5000);
			}
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
