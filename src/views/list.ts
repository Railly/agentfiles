import { setIcon } from "obsidian";
import { TOOL_CONFIGS } from "../tool-configs";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import type { SkillStore } from "../store";
import type { SkillItem } from "../types";

export class ListPanel {
	private containerEl: HTMLElement;
	private store: SkillStore;
	private onSelect: (item: SkillItem) => void;
	private selectedId: string | null = null;
	private inputEl: HTMLInputElement | null = null;
	private listEl: HTMLElement | null = null;
	private typeFilter: string | null = null;
	private sortBy: "name" | "usage" = "name";
	private dropdownEl: HTMLElement | null = null;

	constructor(
		containerEl: HTMLElement,
		store: SkillStore,
		onSelect: (item: SkillItem) => void
	) {
		this.containerEl = containerEl;
		this.store = store;
		this.onSelect = onSelect;
	}

	setSelected(id: string | null): void {
		this.selectedId = id;
	}

	render(): void {
		if (!this.inputEl) {
			this.containerEl.empty();
			this.containerEl.addClass("as-list");

			const searchContainer = this.containerEl.createDiv("as-search");
			this.inputEl = searchContainer.createEl("input", {
				type: "text",
				placeholder: "Search skills...",
				cls: "as-search-input",
			});
			this.inputEl.addEventListener("input", () => {
				this.store.setSearch(this.inputEl!.value);
			});

			const filterBtn = searchContainer.createDiv("as-filter-btn");
			setIcon(filterBtn, "filter");
			filterBtn.setAttribute("aria-label", "Filter by status");
			filterBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleDropdown(filterBtn);
			});

			const sortBtn = searchContainer.createDiv("as-filter-btn");
			setIcon(sortBtn, this.sortBy === "usage" ? "arrow-down-wide-narrow" : "arrow-down-a-z");
			sortBtn.setAttribute("aria-label", this.sortBy === "usage" ? "Sorted by usage" : "Sorted by name");
			sortBtn.addEventListener("click", () => {
				this.sortBy = this.sortBy === "name" ? "usage" : "name";
				setIcon(sortBtn, this.sortBy === "usage" ? "arrow-down-wide-narrow" : "arrow-down-a-z");
				sortBtn.setAttribute("aria-label", this.sortBy === "usage" ? "Sorted by usage" : "Sorted by name");
				this.renderList();
			});

			this.listEl = this.containerEl.createDiv("as-list-items");
		}

		this.inputEl.value = this.store.searchQuery;
		this.renderList();
	}

	private toggleDropdown(anchor: HTMLElement): void {
		if (this.dropdownEl) {
			this.dropdownEl.remove();
			this.dropdownEl = null;
			return;
		}

		this.dropdownEl = anchor.createDiv("as-filter-dropdown");

		const filters: { id: string; label: string; cls: string }[] = [
			{ id: "all", label: "All", cls: "" },
			{ id: "stale", label: "Stale", cls: "as-badge-stale" },
			{ id: "heavy", label: "Heavy", cls: "as-badge-heavy" },
			{ id: "oversized", label: "Oversized", cls: "as-badge-warn" },
			{ id: "conflict", label: "Conflict", cls: "as-badge-conflict" },
		];

		for (const f of filters) {
			const item = this.dropdownEl.createDiv("as-filter-option");
			if ((f.id === "all" && !this.typeFilter) || f.id === this.typeFilter) {
				item.addClass("is-active");
			}
			if (f.cls) {
				item.createSpan({ cls: f.cls, text: f.label });
			} else {
				item.setText(f.label);
			}
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.typeFilter = f.id === "all" ? null : f.id;
				if (this.dropdownEl) {
					this.dropdownEl.remove();
					this.dropdownEl = null;
				}
				this.renderList();
			});
		}

		const closeHandler = () => {
			if (this.dropdownEl) {
				this.dropdownEl.remove();
				this.dropdownEl = null;
			}
			document.removeEventListener("click", closeHandler);
		};
		setTimeout(() => document.addEventListener("click", closeHandler), 0);
	}

	private renderList(): void {
		if (!this.listEl) return;
		this.listEl.empty();

		let items = this.store.filteredItems;
		if (this.typeFilter) {
			switch (this.typeFilter) {
				case "stale":
					items = items.filter((i) => i.usage?.isStale);
					break;
				case "heavy":
					items = items.filter((i) => i.usage?.isHeavy);
					break;
				case "oversized":
					items = items.filter((i) => i.warnings?.oversized);
					break;
				case "conflict":
					items = items.filter((i) => i.conflicts && i.conflicts.length > 0);
					break;
			}
		}

		if (this.sortBy === "usage") {
			items = [...items].sort((a, b) => (b.usage?.uses ?? 0) - (a.usage?.uses ?? 0));
		}

		if (this.typeFilter) {
			const labels: Record<string, string> = { stale: "Stale", heavy: "Heavy", oversized: "Oversized", conflict: "Conflict" };
			const filterLabel = this.listEl.createDiv("as-active-filter");
			filterLabel.createSpan({ text: `Showing: ${labels[this.typeFilter] ?? this.typeFilter}` });
			const clearBtn = filterLabel.createSpan({ cls: "as-filter-clear", text: "Clear" });
			clearBtn.addEventListener("click", () => {
				this.typeFilter = null;
				this.renderList();
			});
		}

		if (items.length === 0) {
			this.listEl.createDiv({
				cls: "as-list-empty",
				text: "No skills found",
			});
			return;
		}

		for (const item of items) {
			this.renderCard(this.listEl, item);
		}
	}

	private renderCard(container: HTMLElement, item: SkillItem): void {
		const card = container.createDiv("as-skill-card");
		if (item.id === this.selectedId) card.addClass("is-selected");

		const header = card.createDiv("as-skill-header");
		header.createSpan({ cls: "as-skill-name", text: item.name });

		if (item.isFavorite) {
			const star = header.createSpan("as-skill-star");
			setIcon(star, "star");
		}

		if (item.description) {
			card.createDiv({
				cls: "as-skill-desc",
				text:
					item.description.length > 80
						? item.description.slice(0, 80) + "..."
						: item.description,
			});
		}

		const meta = card.createDiv("as-skill-meta");

		meta.createSpan({
			cls: `as-type-tag as-type-${item.type}`,
			text: item.type,
		});

		for (const toolId of item.tools) {
			const tool = TOOL_CONFIGS.find((t) => t.id === toolId);
			if (!tool) continue;
			const badge = meta.createSpan("as-tool-badge");
			badge.title = tool.name;
			badge.setAttribute("aria-label", tool.name);
			badge.setCssProps({ "--tool-color": tool.color });
			if (TOOL_SVGS[toolId]) {
				renderToolIcon(badge, toolId, 12);
			} else {
				badge.addClass("as-tool-badge-dot");
			}
		}

		if (item.usage) {
			if (item.usage.uses > 0) {
				meta.createSpan({
					cls: "as-usage-badge",
					text: `${item.usage.uses}`,
					attr: { "aria-label": `Used ${item.usage.uses} times` },
				});
			}
			if (item.usage.isStale) {
				meta.createSpan({ cls: "as-badge-stale", text: "stale" });
			}
			if (item.usage.isHeavy) {
				meta.createSpan({ cls: "as-badge-heavy", text: "heavy" });
			}
		}
		if (item.warnings?.oversized) {
			meta.createSpan({ cls: "as-badge-warn", text: "oversized" });
		}
		if (item.conflicts && item.conflicts.length > 0) {
			meta.createSpan({ cls: "as-badge-conflict", text: "conflict" });
		}

		card.addEventListener("click", () => {
			this.selectedId = item.id;
			this.onSelect(item);
		});
	}
}
