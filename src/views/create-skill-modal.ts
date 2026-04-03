import { Modal, Notice, Setting, type App } from "obsidian";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { TOOL_CONFIGS } from "../tool-configs";
import type { SkillType } from "../types";

interface CreateTarget {
	toolId: string;
	toolName: string;
	baseDir: string;
	type: SkillType;
	pattern: string;
}

function getCreateTargets(): CreateTarget[] {
	const targets: CreateTarget[] = [];
	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		for (const sp of [...tool.paths, ...tool.agentPaths]) {
			if (sp.type === "rule" || sp.type === "memory") continue;
			targets.push({
				toolId: tool.id,
				toolName: tool.name,
				baseDir: sp.baseDir,
				type: sp.type,
				pattern: sp.pattern,
			});
		}
	}
	return targets;
}

function buildTargetLabel(t: CreateTarget): string {
	return `${t.toolName} → ${t.type}`;
}

export class CreateSkillModal extends Modal {
	private onCreated: (filePath: string) => void;
	private name = "";
	private selectedTarget: CreateTarget | null = null;
	private targets: CreateTarget[];

	constructor(app: App, onCreated: (filePath: string) => void) {
		super(app);
		this.onCreated = onCreated;
		this.targets = getCreateTargets();
		if (this.targets.length > 0) {
			this.selectedTarget = this.targets[0];
		}
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("as-create-modal");

		contentEl.createEl("h3", { text: "Create Skill" });

		new Setting(contentEl)
			.setName("Name")
			.setDesc("Skill name (used for directory and display)")
			.addText((text) =>
				text
					.setPlaceholder("my-awesome-skill")
					.onChange((value) => {
						this.name = value.trim();
					})
			);

		if (this.targets.length > 0) {
			const options: Record<string, string> = {};
			for (let i = 0; i < this.targets.length; i++) {
				options[String(i)] = buildTargetLabel(this.targets[i]);
			}

			new Setting(contentEl)
				.setName("Target")
				.setDesc("Where to create the skill")
				.addDropdown((drop) =>
					drop
						.addOptions(options)
						.setValue("0")
						.onChange((value) => {
							this.selectedTarget = this.targets[parseInt(value)];
						})
				);
		}

		const btnContainer = contentEl.createDiv("as-create-buttons");
		const cancelBtn = btnContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const createBtn = btnContainer.createEl("button", {
			text: "Create",
			cls: "mod-cta",
		});
		createBtn.addEventListener("click", () => this.create());
	}

	private create(): void {
		if (!this.name) {
			new Notice("Please enter a skill name");
			return;
		}
		if (!this.selectedTarget) {
			new Notice("No target available");
			return;
		}

		const slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
		const t = this.selectedTarget;
		let filePath: string;

		if (t.pattern === "directory-with-skillmd") {
			const dir = join(t.baseDir, slug);
			if (existsSync(dir)) {
				new Notice(`Directory already exists: ${slug}`);
				return;
			}
			mkdirSync(dir, { recursive: true });
			filePath = join(dir, "SKILL.md");
			writeFileSync(filePath, [
				"---",
				`name: ${this.name}`,
				'description: ""',
				"---",
				"",
				`# ${this.name}`,
				"",
				"## Instructions",
				"",
				"",
			].join("\n"), "utf-8");
		} else {
			if (!existsSync(t.baseDir)) {
				mkdirSync(t.baseDir, { recursive: true });
			}
			filePath = join(t.baseDir, `${slug}.md`);
			if (existsSync(filePath)) {
				new Notice(`File already exists: ${slug}.md`);
				return;
			}
			writeFileSync(filePath, [
				"---",
				`description: ""`,
				"---",
				"",
				"",
			].join("\n"), "utf-8");
		}

		new Notice(`Created ${this.name}`);
		this.close();
		this.onCreated(filePath);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
