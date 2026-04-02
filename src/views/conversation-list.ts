import { setIcon } from "obsidian";
import type { ConversationStore } from "../conversations/store";
import type { ConversationItem } from "../types";

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

			this.listEl = this.containerEl.createDiv("as-list-items");
		}

		this.inputEl.value = this.store.searchQuery;
		this.renderList();
	}

	private renderList(): void {
		if (!this.listEl) return;
		this.listEl.empty();

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
		const card = container.createDiv("as-skill-card as-conv-card");
		if (item.uuid === this.selectedUuid) card.addClass("is-selected");

		const header = card.createDiv("as-skill-header");
		const titleText = item.title.length > 80
			? item.title.slice(0, 80) + "..."
			: item.title;
		header.createSpan({ cls: "as-skill-name", text: titleText });

		if (item.isFavorite) {
			const star = header.createSpan("as-skill-star");
			setIcon(star, "star");
		}

		// Project + time
		const info = card.createDiv("as-conv-info");
		const projBadge = info.createSpan("as-conv-project");
		setIcon(projBadge.createSpan("as-conv-project-icon"), "folder-git-2");
		projBadge.createSpan({ text: item.project });
		info.createSpan({ cls: "as-conv-time", text: timeAgo(item.lastTimestamp) });
		info.createSpan({ cls: "as-conv-msgs", text: `${item.messageCount} msgs` });

		// Tags
		const allTags = [...item.tags, ...item.customTags];
		if (allTags.length > 0) {
			const tagsEl = card.createDiv("as-conv-tags");
			const displayTags = allTags.slice(0, 6);
			for (const tag of displayTags) {
				const isCustom = item.customTags.includes(tag);
				tagsEl.createSpan({
					cls: `as-conv-tag ${isCustom ? "as-conv-tag-custom" : ""}`,
					text: tag,
				});
			}
			if (allTags.length > 6) {
				tagsEl.createSpan({
					cls: "as-conv-tag as-conv-tag-more",
					text: `+${allTags.length - 6}`,
				});
			}
		}

		card.addEventListener("click", () => {
			this.selectedUuid = item.uuid;
			this.onSelect(item);
		});
	}
}
