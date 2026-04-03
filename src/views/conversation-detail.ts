import { Component, MarkdownRenderer, Notice, setIcon, type App } from "obsidian";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import type { ConversationItem, ConversationMessage } from "../types";
import type { ConversationStore } from "../conversations/store";
import { generateNoteContent, generateNotePath } from "../conversations/note-exporter";

function formatTimestamp(ts: string): string {
	if (!ts) return "";
	const d = new Date(ts);
	return d.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export class ConversationDetailPanel {
	private containerEl: HTMLElement;
	private store: ConversationStore;
	private app: App;
	private vaultPath: string;
	private currentItem: ConversationItem | null = null;
	private selectedMessages: Set<number> = new Set();
	private visibleCount = 20;
	private renderComponent = new Component();

	constructor(
		containerEl: HTMLElement,
		store: ConversationStore,
		app: App,
		vaultPath: string
	) {
		this.containerEl = containerEl;
		this.store = store;
		this.app = app;
		this.vaultPath = vaultPath;
	}

	show(item: ConversationItem): void {
		this.currentItem = item;
		this.selectedMessages.clear();
		this.visibleCount = 20;
		this.render();
	}

	clear(): void {
		this.currentItem = null;
		this.containerEl.empty();
		this.containerEl.addClass("as-detail");
		const empty = this.containerEl.createDiv("as-detail-empty");
		setIcon(empty.createDiv("as-detail-empty-icon"), "message-circle");
		empty.createDiv({ text: "Select a conversation to view" });
	}

	private render(): void {
		this.containerEl.empty();
		this.containerEl.addClass("as-detail");
		const item = this.currentItem;
		if (!item) return this.clear();

		this.renderToolbar(item);
		this.renderBody(item);
	}

	private renderToolbar(item: ConversationItem): void {
		const toolbar = this.containerEl.createDiv("as-detail-toolbar");

		const topRow = toolbar.createDiv("as-toolbar-top");
		const left = topRow.createDiv("as-toolbar-left");
		const titleText = item.title.length > 100 ? item.title.slice(0, 100) + "..." : item.title;
		left.createSpan({ cls: "as-detail-title", text: titleText });

		const right = topRow.createDiv("as-toolbar-right");

		// Favorite
		const favBtn = right.createEl("button", {
			cls: "as-toolbar-btn",
			attr: { "aria-label": "Toggle favorite" },
		});
		setIcon(favBtn, item.isFavorite ? "star" : "star-off");
		favBtn.addEventListener("click", () => {
			this.store.toggleFavorite(item.uuid);
			this.render();
		});

		// Copy resume command
		const resumeBtn = right.createEl("button", {
			cls: "as-toolbar-btn",
			attr: { "aria-label": "Copy resume command" },
		});
		setIcon(resumeBtn, "terminal");
		resumeBtn.addEventListener("click", () => {
			void navigator.clipboard.writeText(`claude --resume ${item.uuid}`);
			new Notice("Resume command copied!", 3000);
		});

		// Save to vault
		const saveBtn = right.createEl("button", {
			cls: "as-toolbar-btn as-toolbar-btn-primary",
			attr: { "aria-label": "Save to vault" },
		});
		setIcon(saveBtn, "download");
		saveBtn.addEventListener("click", () => this.saveToVault(item));

		// Meta bar
		const meta = toolbar.createDiv("as-detail-meta-bar");
		meta.createSpan({ cls: "as-meta-item", text: item.project });
		meta.createSpan({ cls: "as-meta-item", text: `${item.messageCount} messages` });
		if (item.firstTimestamp) {
			meta.createSpan({
				cls: "as-meta-item",
				text: new Date(item.firstTimestamp).toLocaleDateString(undefined, {
					month: "short",
					day: "numeric",
					year: "numeric",
				}),
			});
		}

		// Tags
		const allTags = [...item.tags, ...item.customTags];
		if (allTags.length > 0) {
			const tagsBar = toolbar.createDiv("as-conv-detail-tags");
			for (const tag of allTags) {
				const isCustom = item.customTags.includes(tag);
				const tagEl = tagsBar.createSpan({
					cls: `as-conv-tag ${isCustom ? "as-conv-tag-custom" : ""}`,
					text: tag,
				});
				if (isCustom) {
					const removeBtn = tagEl.createSpan("as-conv-tag-remove");
					setIcon(removeBtn, "x");
					removeBtn.addEventListener("click", (e) => {
						e.stopPropagation();
						this.store.removeCustomTag(item.uuid, tag);
						this.render();
					});
				}
			}

			// Add tag button
			const addTagBtn = tagsBar.createSpan("as-conv-tag as-conv-tag-add");
			setIcon(addTagBtn, "plus");
			addTagBtn.addEventListener("click", () => this.promptAddTag(item));
		}
	}

	private renderBody(item: ConversationItem): void {
		const body = this.containerEl.createDiv("as-detail-body");

		// Selection hint
		if (this.selectedMessages.size > 0) {
			const hint = body.createDiv("as-conv-selection-bar");
			hint.createSpan({
				text: `${this.selectedMessages.size} message${this.selectedMessages.size > 1 ? "s" : ""} selected`,
			});
			const saveSelBtn = hint.createEl("button", {
				cls: "as-conv-save-selected-btn",
				text: "Save selected to vault",
			});
			saveSelBtn.addEventListener("click", () => this.saveToVault(item));
		}

		const PAGE_SIZE = 20;
		const total = item.messages.length;
		const messagesToShow = item.messages.slice(0, this.visibleCount);

		for (let i = 0; i < messagesToShow.length; i++) {
			this.renderMessage(body, messagesToShow[i], i);
		}

		if (this.visibleCount < total) {
			const remaining = total - this.visibleCount;
			const nextBatch = Math.min(PAGE_SIZE, remaining);
			const showMore = body.createDiv("as-conv-show-more");

			showMore.createEl("button", {
				text: `Show next ${nextBatch} messages`,
				cls: "as-conv-show-more-btn",
			}).addEventListener("click", () => {
				this.visibleCount += PAGE_SIZE;
				this.render();
			});

			showMore.createEl("button", {
				text: `Show all ${total} messages`,
				cls: "as-conv-show-all-btn",
			}).addEventListener("click", () => {
				this.visibleCount = total;
				this.render();
			});
		}

		// Resume section
		const resumeSection = body.createDiv("as-conv-resume-section");
		resumeSection.createDiv({ cls: "as-section-title", text: "Resume this conversation" });
		const code = resumeSection.createEl("code", {
			cls: "as-conv-resume-cmd",
			text: `claude --resume ${item.uuid}`,
		});
		code.addEventListener("click", () => {
			void navigator.clipboard.writeText(`claude --resume ${item.uuid}`);
			new Notice("Copied!", 2000);
		});
	}

	private renderMessage(container: HTMLElement, msg: ConversationMessage, index: number): void {
		const isHuman = msg.role === "human";
		const wrapper = container.createDiv(
			`as-conv-msg ${isHuman ? "as-conv-msg-human" : "as-conv-msg-assistant"}`
		);

		if (this.selectedMessages.has(index)) {
			wrapper.addClass("as-conv-msg-selected");
		}

		const header = wrapper.createDiv("as-conv-msg-header");
		const roleIcon = header.createSpan("as-conv-msg-role-icon");
		setIcon(roleIcon, isHuman ? "user" : "bot");
		header.createSpan({
			cls: "as-conv-msg-role",
			text: isHuman ? "You" : "Claude",
		});
		if (msg.timestamp) {
			header.createSpan({
				cls: "as-conv-msg-time",
				text: formatTimestamp(msg.timestamp),
			});
		}

		// Select checkbox
		const selectBtn = header.createSpan("as-conv-msg-select");
		setIcon(selectBtn, this.selectedMessages.has(index) ? "check-square" : "square");
		selectBtn.setAttribute("aria-label", "Select message for export");
		selectBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (this.selectedMessages.has(index)) {
				this.selectedMessages.delete(index);
			} else {
				this.selectedMessages.add(index);
			}
			this.render();
		});

		// Message content
		const contentEl = wrapper.createDiv("as-conv-msg-content");
		const displayText = msg.text.length > 2000 && !isHuman
			? msg.text.slice(0, 2000) + "\n\n*... (truncated)*"
			: msg.text;

		void MarkdownRenderer.render(this.app, displayText, contentEl, "", this.renderComponent);

		// Tool calls
		if (msg.toolCalls && msg.toolCalls.length > 0) {
			const toolsEl = wrapper.createDiv("as-conv-msg-tools");
			const uniqueTools = [...new Set(msg.toolCalls)];
			for (const tool of uniqueTools.slice(0, 5)) {
				toolsEl.createSpan({ cls: "as-conv-tool-badge", text: tool });
			}
			if (uniqueTools.length > 5) {
				toolsEl.createSpan({
					cls: "as-conv-tool-badge",
					text: `+${uniqueTools.length - 5}`,
				});
			}
		}
	}

	private promptAddTag(item: ConversationItem): void {
		const tagsBar = this.containerEl.querySelector(".as-conv-detail-tags");
		if (!tagsBar) return;

		const addBtn = tagsBar.querySelector(".as-conv-tag-add");
		if (!addBtn) return;

		const input = createEl("input", {
			type: "text",
			placeholder: "Enter tag...",
			cls: "as-conv-tag-input",
		});

		addBtn.replaceWith(input);
		input.focus();

		let submitted = false;
		const submit = () => {
			if (submitted) return;
			submitted = true;
			const tag = input.value.trim().toLowerCase().replace(/\s+/g, "-");
			if (tag) {
				this.store.addCustomTag(item.uuid, tag);
			}
			this.render();
		};

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") submit();
			if (e.key === "Escape") this.render();
		});
		input.addEventListener("blur", submit);
	}

	private saveToVault(item: ConversationItem): void {
		if (this.selectedMessages.size === 0) {
			new Notice("Select messages to export first", 3000);
			return;
		}

		const selected = Array.from(this.selectedMessages)
			.sort((a, b) => a - b)
			.map((i) => item.messages[i])
			.filter(Boolean);

		const content = generateNoteContent({
			selectedMessages: selected,
			conversation: item,
			vaultPath: this.vaultPath,
		});

		const notePath = resolve(generateNotePath(item, this.vaultPath));
		if (!notePath.startsWith(resolve(this.vaultPath))) {
			new Notice("Invalid path — cannot save outside vault", 5000);
			return;
		}

		const dir = dirname(notePath);

		try {
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			writeFileSync(notePath, content, "utf-8");
			new Notice(`Saved to ${notePath.split("/").slice(-2).join("/")}`, 5000);
		} catch (e: unknown) {
			new Notice(`Failed to save: ${e instanceof Error ? e.message : String(e)}`, 5000);
		}
	}
}
