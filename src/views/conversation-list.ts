import { setIcon } from "obsidian";
import type { ConversationStore } from "../conversations/store";
import type { ConversationItem } from "../types";

function sanitizeTitle(raw: string): string {
	return raw
		.replace(/<[^>]+>/g, "")
		.replace(/\[Image #?\d*\]/gi, "")
		.replace(/\s+/g, " ")
		.trim() || "(untitled)";
}

function timeAgo(ts: string): string {
	if (!ts) return "";
	const diff = Date.now() - new Date(ts).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	const months = Math.floor(days / 30);
	return `${months}mo ago`;
}

function formatDate(ts: string): string {
	if (!ts) return "";
	return new Date(ts).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export class ConversationListPanel {
	private containerEl: HTMLElement;
	private store: ConversationStore;
	private onSelect: (item: ConversationItem) => void;
	private selectedUuid: string | null = null;
	private inputEl: HTMLInputElement | null = null;
	private listEl: HTMLElement | null = null;

	constructor(
		containerEl: HTMLElement,
		store: ConversationStore,
		onSelect: (item: ConversationItem) => void
	) {
		this.containerEl = containerEl;
		this.store = store;
		this.onSelect = onSelect;
	}

	setSelected(uuid: string | null): void {
		this.selectedUuid = uuid;
	}

	render(): void {
		if (!this.inputEl) {
			this.containerEl.empty();
			this.containerEl.addClass("as-list");

			const searchContainer = this.containerEl.createDiv("as-search");
			this.inputEl = searchContainer.createEl("input", {
				type: "text",
				placeholder: "Search conversations...",
				cls: "as-search-input",
			});
			this.inputEl.addEventListener("input", () => {
				this.store.setSearch(this.inputEl!.value);
			});

			this.listEl = this.containerEl.createDiv("as-list-items as-conv-list");
		}

		this.inputEl.value = this.store.searchQuery;
		this.renderList();
	}

	private renderList(): void {
		if (!this.listEl) return;
		this.listEl.empty();

		if (this.store.loading) {
			this.listEl.createDiv({
				cls: "as-list-empty",
				text: "Loading conversations...",
			});
			return;
		}

		const items = this.store.filteredItems;

		if (items.length === 0) {
			this.listEl.createDiv({
				cls: "as-list-empty",
				text: "No conversations found",
			});
			return;
		}

		// Group by date sections
		let lastDate = "";
		for (const item of items) {
			const date = formatDate(item.lastTimestamp);
			if (date !== lastDate) {
				lastDate = date;
				this.listEl.createDiv({
					cls: "as-conv-date-header",
					text: date,
				});
			}
			this.renderCard(this.listEl, item);
		}
	}

	private renderCard(container: HTMLElement, item: ConversationItem): void {
		const card = container.createDiv("as-skill-card");
		if (item.uuid === this.selectedUuid) card.addClass("is-selected");

		const header = card.createDiv("as-skill-header");
		const cleanTitle = sanitizeTitle(item.title);
		const titleText = cleanTitle.length > 60
			? cleanTitle.slice(0, 60) + "..."
			: cleanTitle;
		header.createSpan({ cls: "as-skill-name", text: titleText });

		if (item.isFavorite) {
			const star = header.createSpan("as-skill-star");
			setIcon(star, "star");
		}

		const desc = [item.project, timeAgo(item.lastTimestamp), `${item.messageCount} msgs`]
			.filter(Boolean).join(" · ");
		card.createDiv({ cls: "as-skill-desc", text: desc });

		const visibleTags = [...item.tags, ...item.customTags]
			.filter((t) => t !== item.project);
		if (visibleTags.length > 0) {
			const meta = card.createDiv("as-skill-meta");
			const MAX_TAGS = 3;
			for (const tag of visibleTags.slice(0, MAX_TAGS)) {
				const isCustom = item.customTags.includes(tag);
				meta.createSpan({
					cls: `as-conv-tag ${isCustom ? "as-conv-tag-custom" : ""}`,
					text: tag,
				});
			}
			if (visibleTags.length > MAX_TAGS) {
				meta.createSpan({
					cls: "as-conv-tag as-conv-tag-more",
					text: `+${visibleTags.length - MAX_TAGS}`,
				});
			}
		}

		card.addEventListener("click", () => {
			this.selectedUuid = item.uuid;
			this.onSelect(item);
		});
	}
}
