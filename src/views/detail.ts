import { MarkdownRenderer, Notice, setIcon, type App } from "obsidian";
import { writeFileSync, realpathSync, readlinkSync, lstatSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { shell } from "electron";
import type { SkillItem, ChopsSettings } from "../types";
import type { SkillStore } from "../store";
import { TOOL_CONFIGS } from "../tool-configs";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import { formatLastUsed } from "../skillkit";

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

const HOME = homedir();

// Directories under ~ that are commonly symlinked (e.g. OneDrive, iCloud)
const SHORTABLE_DIRS = ["Documents", "Desktop", "Downloads", "Pictures", "Music", "Movies"];

let _symlinkMap: Map<string, string> | null = null;

function getSymlinkMap(): Map<string, string> {
	if (_symlinkMap) return _symlinkMap;
	_symlinkMap = new Map();
	for (const dir of SHORTABLE_DIRS) {
		const logical = join(HOME, dir);
		try {
			const stat = lstatSync(logical);
			if (stat.isSymbolicLink()) {
				const real = realpathSync(logical);
				// Map the resolved real path back to the short logical path
				_symlinkMap.set(real, logical);
			}
		} catch { /* empty */ }
	}
	return _symlinkMap;
}

function shortenPath(filePath: string): string {
	// First try to resolve real paths back through known symlinks
	for (const [real, logical] of getSymlinkMap()) {
		if (filePath.startsWith(real + "/") || filePath === real) {
			filePath = logical + filePath.slice(real.length);
			break;
		}
	}
	// Then shorten HOME prefix to ~
	if (filePath.startsWith(HOME + "/") || filePath === HOME) {
		filePath = "~" + filePath.slice(HOME.length);
	}
	return filePath;
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
			badge.style.borderColor = tool.color;
			badge.style.color = tool.color;
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
			attr: { "aria-label": "Open in Finder" },
		});
		setIcon(openBtn, "folder-open");
		openBtn.addEventListener("click", () => {
			shell.showItemInFolder(item.filePath);
		});

		const meta = toolbar.createDiv("as-detail-meta-bar");
		const tokens = estimateTokens(item.content);
		const chars = item.content.length;

		meta.createSpan({ cls: "as-meta-item", text: formatSize(item.fileSize) });
		meta.createSpan({ cls: "as-meta-item", text: `${formatNumber(chars)} chars` });
		meta.createSpan({ cls: "as-meta-item", text: `~${formatNumber(tokens)} tokens` });
		meta.createSpan({ cls: "as-meta-item", text: formatDate(item.lastModified) });
		meta.createSpan({ cls: "as-meta-item as-meta-type", text: item.type });

		const displayPath = shortenPath(item.filePath);
		const pathEl = toolbar.createDiv("as-detail-path");
		pathEl.setText(displayPath);
		pathEl.title = item.filePath;

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
		if (keys.length === 0) return;

		const section = container.createDiv("as-frontmatter");

		for (const key of keys) {
			const value = item.frontmatter[key];
			if (value === undefined || value === null) continue;

			const prop = section.createDiv("as-fm-prop");
			prop.createSpan({ cls: "as-fm-key", text: key });

			const valStr =
				typeof value === "object" ? JSON.stringify(value) : String(value);

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
		const previewEl = body.createDiv("as-detail-preview markdown-rendered");
		void MarkdownRenderer.render(
			this.app,
			item.content,
			previewEl,
			item.filePath,
			this
		);
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
			new Notice(`Saved ${item.name}`);
		} catch (e: unknown) {
			new Notice(`Failed to save: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
}
