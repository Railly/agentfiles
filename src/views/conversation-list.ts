import { setIcon } from "obsidian";
import type { ConversationStore } from "../conversations/store";
import type { ConversationItem, ConversationSort, ConversationDateRange } from "../types";

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
	private toolbarEl: HTMLElement | null = null;
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

			this.searchRowEl = this.containerEl.createDiv("as-search");
			this.inputEl = this.searchRowEl.createEl("input", {
				type: "text",
				placeholder: "Search conversations...",
				cls: "as-search-input",
			});
			this.inputEl.addEventListener("input", () => {
				this.store.setSearch(this.inputEl!.value);
			});

			this.toolbarEl = this.containerEl.createDiv("as-conv-toolbar");
			this.listEl = this.containerEl.createDiv("as-list-items as-conv-list");
		}

		this.inputEl.value = this.store.searchQuery;
		this.renderSearchActions();
		this.renderTagStrip();
		this.renderList();
	}

	private searchRowEl: HTMLElement | null = null;
	private searchActionsEl: HTMLElement | null = null;
	private outsideClickCleanup: (() => void) | null = null;
	private dateDropdownEl: HTMLElement | null = null;
	private tagDropdownEl: HTMLElement | null = null;
	private openDropdown: "date" | "tag" | null = null;

	private closeAllDropdowns(): void {
		this.openDropdown = null;
		this.dateDropdownEl?.removeClass("is-open");
		this.tagDropdownEl?.removeClass("is-open");
		if (this.outsideClickCleanup) {
			this.outsideClickCleanup();
			this.outsideClickCleanup = null;
		}
	}

	private toggleDropdown(which: "date" | "tag", wrapper: HTMLElement): void {
		if (this.openDropdown === which) {
			this.closeAllDropdowns();
			return;
		}
		this.closeAllDropdowns();
		this.openDropdown = which;
		const dd = which === "date" ? this.dateDropdownEl : this.tagDropdownEl;
		dd?.addClass("is-open");

		const close = (ev: MouseEvent) => {
			if (!wrapper.contains(ev.target as Node)) {
				this.closeAllDropdowns();
			}
		};
		window.setTimeout(() => activeDocument.addEventListener("click", close), 0);
		this.outsideClickCleanup = () => activeDocument.removeEventListener("click", close);
	}

	private renderSearchActions(): void {
		if (!this.searchRowEl) return;
		if (this.searchActionsEl) this.searchActionsEl.remove();
		this.searchActionsEl = this.searchRowEl.createDiv("as-conv-search-actions");

		const dateWrapper = this.searchActionsEl.createDiv("as-conv-dropdown-wrap");
		const dateBtn = dateWrapper.createEl("button", { cls: "as-conv-icon-btn" });
		const dateIco = dateBtn.createSpan("as-conv-icon-btn-icon");
		setIcon(dateIco, "calendar");

		this.dateDropdownEl = dateWrapper.createDiv("as-conv-dropdown");
		if (this.openDropdown === "date") this.dateDropdownEl.addClass("is-open");

		const ranges: { label: string; value: ConversationDateRange }[] = [
			{ label: "Today", value: "today" },
			{ label: "Last 7 days", value: "7d" },
			{ label: "Last 30 days", value: "30d" },
			{ label: "Last 90 days", value: "90d" },
			{ label: "Last 6 months", value: "180d" },
			{ label: "All time", value: "all" },
		];
		for (const r of ranges) {
			const isActive = this.store.dateRange === r.value;
			const item = this.dateDropdownEl.createDiv(`as-conv-dropdown-item ${isActive ? "is-active" : ""}`);
			const check = item.createSpan("as-conv-dropdown-check");
			if (isActive) setIcon(check, "check");
			item.createSpan({ cls: "as-conv-dropdown-item-label", text: r.label });
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.store.setDateRange(r.value);
				this.closeAllDropdowns();
			});
		}

		dateBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggleDropdown("date", dateWrapper);
		});

		const allTags = this.store.getAllTags();
		const activeTags = this.store.activeTags;
		const hasTags = allTags.size > 0;

		const tagWrapper = this.searchActionsEl.createDiv("as-conv-dropdown-wrap");
		const tagBtn = tagWrapper.createEl("button", { cls: "as-conv-icon-btn" });
		if (!hasTags) tagBtn.addClass("is-disabled");
		if (activeTags.length > 0) tagBtn.addClass("has-active");
		const tagIco = tagBtn.createSpan("as-conv-icon-btn-icon");
		setIcon(tagIco, "tag");

		this.tagDropdownEl = tagWrapper.createDiv("as-conv-dropdown");
		if (this.openDropdown === "tag") this.tagDropdownEl.addClass("is-open");

		if (hasTags) {
			if (activeTags.length > 0) {
				const clearRow = this.tagDropdownEl.createDiv("as-conv-dropdown-item as-conv-dropdown-clear");
				const clearIco = clearRow.createSpan("as-conv-dropdown-item-icon");
				setIcon(clearIco, "x");
				clearRow.createSpan({ text: "Clear filters" });
				clearRow.addEventListener("click", (e) => {
					e.stopPropagation();
					this.store.clearTags();
				});
			}

			const sorted = Array.from(allTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 25);
			for (const [tag, count] of sorted) {
				const isActive = activeTags.includes(tag);
				const item = this.tagDropdownEl.createDiv(`as-conv-dropdown-item ${isActive ? "is-active" : ""}`);
				const check = item.createSpan("as-conv-dropdown-check");
				if (isActive) setIcon(check, "check");
				item.createSpan({ cls: "as-conv-dropdown-item-label", text: tag });
				item.createSpan({ cls: "as-conv-dropdown-item-count", text: String(count) });
				item.addEventListener("click", (e) => {
					e.stopPropagation();
					this.store.toggleTag(tag);
				});
			}
		}

		tagBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (!hasTags) return;
			this.toggleDropdown("tag", tagWrapper);
		});

		const nextSort: ConversationSort = this.store.sort === "date" ? "messages" : "date";
		const sortBtn = this.searchActionsEl.createEl("button", { cls: "as-conv-icon-btn" });
		const sortIco = sortBtn.createSpan("as-conv-icon-btn-icon");
		setIcon(sortIco, this.store.sort === "date" ? "clock" : "hash");
		sortBtn.setAttribute("aria-label", `Sort by ${nextSort}`);
		sortBtn.addEventListener("click", () => this.store.setSort(nextSort));
	}

	private renderTagStrip(): void {
		if (!this.toolbarEl) return;
		this.toolbarEl.empty();

		const activeTags = this.store.activeTags;
		const count = this.store.filteredItems.length;

		if (activeTags.length === 0 && count === this.store.allItems.length) return;

		const strip = this.toolbarEl.createDiv("as-conv-tag-strip");

		strip.createSpan({ cls: "as-conv-result-count", text: `${count} results` });

		for (const tag of activeTags) {
			const pill = strip.createEl("button", { cls: "as-conv-tag-pill is-active" });
			pill.createSpan({ text: tag });
			const x = pill.createSpan("as-conv-tag-pill-x");
			setIcon(x, "x");
			pill.addEventListener("click", () => this.store.toggleTag(tag));
		}

		if (activeTags.length > 0) {
			const clearBtn = strip.createEl("button", { cls: "as-conv-tag-pill as-conv-tag-clear" });
			clearBtn.createSpan({ text: "Clear all" });
			clearBtn.addEventListener("click", () => this.store.clearTags());
		}
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
