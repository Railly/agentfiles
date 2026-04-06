import { Modal, Notice, setIcon, type App } from "obsidian";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { TOOL_CONFIGS } from "../tool-configs";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import type { ToolConfig, SkillPath } from "../types";

interface ToolOption {
	tool: ToolConfig;
	paths: { sp: SkillPath; label: string }[];
}

function getToolOptions(): ToolOption[] {
	const options: ToolOption[] = [];
	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		const paths: { sp: SkillPath; label: string }[] = [];
		for (const sp of [...tool.paths, ...tool.agentPaths]) {
			if (sp.type === "rule" || sp.type === "memory") continue;
			paths.push({ sp, label: sp.type });
		}
		if (paths.length > 0) options.push({ tool, paths });
	}
	return options;
}

const TYPE_ICONS: Record<string, string> = {
	skill: "sparkles",
	command: "terminal",
	agent: "bot",
};

export class CreateSkillModal extends Modal {
	private onCreated: (filePath: string) => void;
	private toolOptions: ToolOption[];
	private selectedTool: ToolOption | null = null;
	private selectedPath: { sp: SkillPath; label: string } | null = null;
	private name = "";
	private step: "tool" | "type" | "name" = "tool";

	constructor(app: App, onCreated: (filePath: string) => void) {
		super(app);
		this.onCreated = onCreated;
		this.toolOptions = getToolOptions();
	}

	onOpen(): void {
		this.modalEl.addClass("as-create-modal");
		this.render();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		if (this.step === "tool") this.renderToolStep(contentEl);
		else if (this.step === "type") this.renderTypeStep(contentEl);
		else this.renderNameStep(contentEl);
	}

	private renderToolStep(el: HTMLElement): void {
		this.renderHeader(el, "Choose tool", null);
		const grid = el.createDiv("as-create-grid");

		for (const opt of this.toolOptions) {
			const card = grid.createDiv("as-create-card");
			card.style.setProperty("--tool-color", opt.tool.color);

			const iconEl = card.createDiv("as-create-card-icon");
			if (TOOL_SVGS[opt.tool.id]) {
				renderToolIcon(iconEl, opt.tool.id, 24);
			}

			card.createDiv({ cls: "as-create-card-name", text: opt.tool.name });

			card.addEventListener("click", () => {
				this.selectedTool = opt;
				if (opt.paths.length === 1) {
					this.selectedPath = opt.paths[0];
					this.step = "name";
				} else {
					this.step = "type";
				}
				this.render();
			});
		}
	}

	private renderTypeStep(el: HTMLElement): void {
		if (!this.selectedTool) return;
		this.renderHeader(el, `${this.selectedTool.tool.name}`, () => {
			this.step = "tool";
			this.render();
		});

		const subtitle = el.createDiv("as-create-subtitle");
		subtitle.setText("What do you want to create?");

		const grid = el.createDiv("as-create-type-grid");

		for (const path of this.selectedTool.paths) {
			const card = grid.createDiv("as-create-type-card");
			card.style.setProperty("--tool-color", this.selectedTool.tool.color);

			const iconName = TYPE_ICONS[path.label] || "file";
			const iconEl = card.createDiv("as-create-type-icon");
			setIcon(iconEl, iconName);

			card.createDiv({ cls: "as-create-type-label", text: path.label });

			card.addEventListener("click", () => {
				this.selectedPath = path;
				this.step = "name";
				this.render();
			});
		}
	}

	private renderNameStep(el: HTMLElement): void {
		if (!this.selectedTool || !this.selectedPath) return;

		const prevStep = this.selectedTool.paths.length > 1 ? "type" : "tool";
		this.renderHeader(el, `New ${this.selectedPath.label}`, () => {
			this.step = prevStep;
			this.render();
		});

		const toolBadge = el.createDiv("as-create-badge");
		toolBadge.style.setProperty("--tool-color", this.selectedTool.tool.color);
		const badgeIcon = toolBadge.createSpan("as-create-badge-icon");
		if (TOOL_SVGS[this.selectedTool.tool.id]) {
			renderToolIcon(badgeIcon, this.selectedTool.tool.id, 14);
		}
		toolBadge.createSpan({ text: this.selectedTool.tool.name });

		const inputContainer = el.createDiv("as-create-input-wrap");
		const input = inputContainer.createEl("input", {
			type: "text",
			placeholder: `my-${this.selectedPath.label}-name`,
			cls: "as-create-input",
		});
		input.value = this.name;
		input.addEventListener("input", () => {
			this.name = input.value.trim();
		});
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && this.name) this.create();
		});
		setTimeout(() => input.focus(), 10);

		const btnRow = el.createDiv("as-create-actions");
		const createBtn = btnRow.createEl("button", {
			text: `Create ${this.selectedPath.label}`,
			cls: "as-create-submit",
		});
		createBtn.style.setProperty("--tool-color", this.selectedTool.tool.color);
		createBtn.addEventListener("click", () => this.create());
	}

	private renderHeader(el: HTMLElement, title: string, onBack: (() => void) | null): void {
		const header = el.createDiv("as-create-header");
		if (onBack) {
			const backBtn = header.createDiv("as-create-back");
			setIcon(backBtn, "chevron-left");
			backBtn.addEventListener("click", onBack);
		}
		header.createDiv({ cls: "as-create-title", text: title });
	}

	private create(): void {
		if (!this.name || !this.selectedPath) return;

		const slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
		if (!slug) {
			new Notice("Invalid name");
			return;
		}

		const sp = this.selectedPath.sp;
		let filePath: string;

		if (sp.pattern === "directory-with-skillmd") {
			const dir = join(sp.baseDir, slug);
			if (existsSync(dir)) {
				new Notice(`Already exists: ${slug}`);
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
			if (!existsSync(sp.baseDir)) {
				mkdirSync(sp.baseDir, { recursive: true });
			}
			filePath = join(sp.baseDir, `${slug}.md`);
			if (existsSync(filePath)) {
				new Notice(`Already exists: ${slug}.md`);
				return;
			}
			writeFileSync(filePath, [
				"---",
				'description: ""',
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
