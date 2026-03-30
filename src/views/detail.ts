import { MarkdownRenderer, Notice, setIcon, type App } from "obsidian";
import { writeFileSync } from "fs";
import { shell } from "electron";
import type { SkillItem, ChopsSettings } from "../types";
import type { SkillStore } from "../store";
import { TOOL_CONFIGS } from "../tool-configs";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import { formatLastUsed, getSkillTraces, runSkillkitAction, isSkillkitAvailable } from "../skillkit";
import { renderSparkline } from "./sparkline";
import { showConfirmModal } from "./confirm-modal";

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatNumber(n: number): string {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

function formatDate(ms: number): string {
	return new Date(ms).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export class DetailPanel {
	private containerEl: HTMLElement;
	private store: SkillStore;
	private settings: ChopsSettings;
	private saveSettings: () => Promise<void>;
	private currentItem: SkillItem | null = null;
	private isEditing = false;
	private app: App;

	constructor(
		containerEl: HTMLElement,
		store: SkillStore,
		settings: ChopsSettings,
		saveSettings: () => Promise<void>,
		view: { app: App }
	) {
		this.containerEl = containerEl;
		this.store = store;
		this.settings = settings;
		this.saveSettings = saveSettings;
		this.app = view.app;
	}

	show(item: SkillItem): void {
		this.currentItem = item;
		this.isEditing = false;
		this.render();
	}

	clear(): void {
		this.currentItem = null;
		this.containerEl.empty();
		this.containerEl.addClass("as-detail");
		const empty = this.containerEl.createDiv("as-detail-empty");
		setIcon(empty.createDiv("as-detail-empty-icon"), "file-text");
		empty.createDiv({ text: "Select a skill to view" });
	}

	private render(): void {
		this.containerEl.empty();
		this.containerEl.addClass("as-detail");
		const item = this.currentItem;
		if (!item) return this.clear();

		this.renderToolbar(item);

		if (this.isEditing) {
			this.renderEditor(item);
		} else {
			this.renderPreview(item);
		}
	}

	private renderToolbar(item: SkillItem): void {
		const toolbar = this.containerEl.createDiv("as-detail-toolbar");

		const topRow = toolbar.createDiv("as-toolbar-top");

		const left = topRow.createDiv("as-toolbar-left");
		left.createSpan({ cls: "as-detail-title", text: item.name });

		for (const toolId of item.tools) {
			const tool = TOOL_CONFIGS.find((t) => t.id === toolId);
			if (!tool) continue;
			const badge = left.createSpan("as-tool-name-badge");
			badge.setCssProps({ "--tool-color": tool.color });
			if (TOOL_SVGS[toolId]) {
				renderToolIcon(badge, toolId, 12);
			}
			badge.createSpan({ text: tool.name });
		}

		const right = topRow.createDiv("as-toolbar-right");

		const favBtn = right.createEl("button", {
			cls: "as-toolbar-btn",
			attr: { "aria-label": "Toggle favorite" },
		});
		setIcon(favBtn, item.isFavorite ? "star" : "star-off");
		favBtn.addEventListener("click", () => {
			this.store.toggleFavorite(item.id, this.settings);
			void this.saveSettings();
			this.render();
		});

		const editBtn = right.createEl("button", {
			cls: "as-toolbar-btn",
			attr: { "aria-label": this.isEditing ? "Preview" : "Edit" },
		});
		setIcon(editBtn, this.isEditing ? "eye" : "pencil");
		editBtn.addEventListener("click", () => {
			this.isEditing = !this.isEditing;
			this.render();
		});

		const openBtn = right.createEl("button", {
			cls: "as-toolbar-btn",
			attr: { "aria-label": "Show in system explorer" },
		});
		setIcon(openBtn, "folder-open");
		openBtn.addEventListener("click", () => {
			shell.showItemInFolder(item.filePath);
		});

		if (isSkillkitAvailable()) {
			const deleteBtn = right.createEl("button", {
				cls: "as-toolbar-btn as-toolbar-btn-danger",
				attr: { "aria-label": "Remove skill" },
			});
			setIcon(deleteBtn, "trash-2");
			deleteBtn.addEventListener("click", () => {
				showConfirmModal(this.app, "Remove skill", `Remove "${item.name}"? This will delete the skill files.`, () => {
					const result = runSkillkitAction(`prune --skill ${item.name} --yes`);
					if (result.success) {
						new Notice(`Removed ${item.name}`, 5000);
						this.store.refresh(this.settings);
						this.clear();
					} else {
						new Notice(`Failed to remove: ${result.output}`, 5000);
					}
				});
			});
		}

		const meta = toolbar.createDiv("as-detail-meta-bar");
		const tokens = estimateTokens(item.content);
		const chars = item.content.length;

		meta.createSpan({ cls: "as-meta-item", text: formatSize(item.fileSize) });
		meta.createSpan({ cls: "as-meta-item", text: `${formatNumber(chars)} chars` });
		meta.createSpan({ cls: "as-meta-item", text: `~${formatNumber(tokens)} tokens` });
		meta.createSpan({ cls: "as-meta-item", text: formatDate(item.lastModified) });
		meta.createSpan({ cls: "as-meta-item as-meta-type", text: item.type });

		if (item.usage && item.usage.uses > 0) {
			const usageMeta = toolbar.createDiv("as-detail-usage-bar");
			usageMeta.createSpan({ cls: "as-usage-stat", text: `${item.usage.uses} uses` });
			usageMeta.createSpan({
				cls: "as-usage-stat",
				text: `last: ${formatLastUsed(item.usage.lastUsed)}`,
			});
			if (item.usage.isStale) {
				usageMeta.createSpan({ cls: "as-badge-stale", text: "stale" });
			}
			if (item.usage.isHeavy) {
				usageMeta.createSpan({ cls: "as-badge-heavy", text: "heavy" });
			}
		}
	}

	private renderFrontmatter(container: HTMLElement, item: SkillItem): void {
		const keys = Object.keys(item.frontmatter);
		const section = container.createDiv("as-frontmatter");

		if (item.filePath) {
			const pathProp = section.createDiv("as-fm-prop");
			pathProp.createSpan({ cls: "as-fm-key", text: "path" });
			pathProp.createSpan({ cls: "as-fm-value", text: item.filePath });
		}

		if (keys.length === 0 && !item.filePath) return;

		for (const key of keys) {
			const value = item.frontmatter[key];
			if (value === undefined || value === null) continue;

			const prop = section.createDiv("as-fm-prop");
			prop.createSpan({ cls: "as-fm-key", text: key });

			const valStr =
				(typeof value === "object" || Array.isArray(value)) ? JSON.stringify(value) : String(value as string | number | boolean);

			if (valStr.length > 200) {
				prop.createDiv({ cls: "as-fm-value-long", text: valStr });
			} else {
				prop.createSpan({ cls: "as-fm-value", text: valStr });
			}
		}
	}

	private renderPreview(item: SkillItem): void {
		const body = this.containerEl.createDiv("as-detail-body");
		this.renderFrontmatter(body, item);
		this.renderWarnings(body, item);
		this.renderUsageSection(body, item);
		this.renderConflicts(body, item);
		this.renderTraces(body, item);
		const previewEl = body.createDiv("as-detail-preview markdown-rendered");
		void MarkdownRenderer.render(
			this.app,
			item.content,
			previewEl,
			item.filePath,
			this
		);
	}

	private renderWarnings(container: HTMLElement, item: SkillItem): void {
		const warns: string[] = [];
		if (item.warnings?.oversized) {
			warns.push(`${item.warnings.lineCount} lines (recommended: <500)`);
		}
		if (item.warnings?.longDesc) {
			warns.push(`Description is ${item.warnings.descChars} chars (recommended: <1024)`);
		}
		if (item.conflicts && item.conflicts.length > 0) {
			const names = item.conflicts.map((c) => c.skillName).join(", ");
			warns.push(`Conflicts with: ${names}`);
		}
		if (warns.length === 0) return;

		const section = container.createDiv("as-warnings");
		const iconEl = section.createDiv("as-warnings-icon");
		setIcon(iconEl, "alert-triangle");
		const list = section.createDiv("as-warnings-list");
		for (const w of warns) {
			list.createDiv({ cls: "as-warnings-item", text: w });
		}
	}

	private renderUsageSection(container: HTMLElement, item: SkillItem): void {
		if (!item.usage || item.usage.uses === 0) return;

		const section = container.createDiv("as-usage-section");
		const left = section.createDiv("as-usage-left");
		left.createSpan({ cls: "as-usage-count", text: String(item.usage.uses) });
		left.createSpan({ cls: "as-usage-label", text: "uses" });
		left.createSpan({ cls: "as-usage-last", text: formatLastUsed(item.usage.lastUsed) });

		if (item.usage.daily && item.usage.daily.length > 1) {
			const sparkContainer = section.createDiv("as-usage-spark");
			renderSparkline(sparkContainer, item.usage.daily.map((d) => d.count), 80, 20);
		}
	}

	private renderConflicts(container: HTMLElement, item: SkillItem): void {
		if (!item.conflicts || item.conflicts.length === 0) return;

		const section = container.createDiv("as-conflicts-section");
		section.createDiv({ cls: "as-section-title", text: `Conflicts (${item.conflicts.length})` });

		for (const conflict of item.conflicts) {
			const row = section.createDiv("as-conflict-row");
			row.createSpan({ cls: "as-conflict-name", text: conflict.skillName });
			const barWrap = row.createDiv("as-conflict-bar-wrap");
			const bar = barWrap.createDiv("as-conflict-bar");
			bar.setCssProps({ "--bar-w": `${(conflict.similarity * 100).toFixed(0)}%` });
			row.createSpan({ cls: "as-conflict-score", text: `${(conflict.similarity * 100).toFixed(0)}%` });
		}
	}

	private renderTraces(container: HTMLElement, item: SkillItem): void {
		if (!isSkillkitAvailable()) return;

		const traces = getSkillTraces(item.name);
		if (traces.length === 0) return;

		const section = container.createDiv("as-traces-section");
		section.createDiv({ cls: "as-section-title", text: `Recent traces (${traces.length})` });

		const table = section.createDiv("as-traces-table");
		for (const trace of traces) {
			const row = table.createDiv("as-trace-row");
			const date = new Date(trace.timestamp);
			row.createSpan({ cls: "as-trace-date", text: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
			row.createSpan({ cls: "as-trace-model", text: trace.model.replace("claude-", "").replace("-4-6", "") });
			row.createSpan({ cls: "as-trace-tokens", text: `${(trace.tokens / 1000).toFixed(1)}k` });
			row.createSpan({ cls: "as-trace-cost", text: trace.cost > 0 ? `$${trace.cost.toFixed(2)}` : "" });
			row.createSpan({ cls: "as-trace-duration", text: `${(trace.duration / 1000).toFixed(1)}s` });
		}

		section.createDiv({ cls: "as-traces-hint", text: "skillkit trace --list --skill " + item.name });
	}

	private renderPruneAction(container: HTMLElement, item: SkillItem): void {
		const section = container.createDiv("as-prune-section");
		const btn = section.createEl("button", { cls: "as-prune-btn", text: "Remove this skill" });
		section.createSpan({ cls: "as-prune-hint", text: "This skill hasn't been used in 30+ days" });

		btn.addEventListener("click", () => {
			showConfirmModal(this.app, "Remove skill", `Remove "${item.name}"? This will delete the skill files.`, () => {
				const result = runSkillkitAction(`prune --skill ${item.name} --yes`);
				if (result.success) {
					new Notice(`Removed ${item.name}`, 5000);
					this.store.refresh(this.settings);
				} else {
					new Notice(`Failed to remove: ${result.output}`, 5000);
				}
			});
		});
	}

	private renderEditor(item: SkillItem): void {
		const body = this.containerEl.createDiv("as-detail-body as-detail-body-editor");

		const textarea = body.createEl("textarea", {
			cls: "as-editor-textarea",
		});
		textarea.value = item.content;
		textarea.spellcheck = false;

		textarea.addEventListener("keydown", (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				this.saveFile(item, textarea.value);
			}
			if (e.key === "Tab") {
				e.preventDefault();
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;
				textarea.value =
					textarea.value.substring(0, start) +
					"\t" +
					textarea.value.substring(end);
				textarea.selectionStart = textarea.selectionEnd = start + 1;
			}
		});

		const saveBar = body.createDiv("as-save-bar");
		const saveBtn = saveBar.createEl("button", {
			cls: "as-save-btn",
			text: "Save",
		});
		saveBtn.addEventListener("click", () => {
			this.saveFile(item, textarea.value);
		});
		saveBar.createSpan({ cls: "as-save-hint", text: "Cmd+S to save" });
	}

	private saveFile(item: SkillItem, content: string): void {
		try {
			writeFileSync(item.filePath, content, "utf-8");
			item.content = content;
			new Notice(`Saved ${item.name}`, 5000);
		} catch (e: unknown) {
			new Notice(`Failed to save: ${e instanceof Error ? e.message : String(e)}`, 5000);
		}
	}
}
