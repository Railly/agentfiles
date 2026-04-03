import { Menu, setIcon } from "obsidian";
import { shell } from "electron";
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
	private deepToggleEl: HTMLElement | null = null;
	private listEl: HTMLElement | null = null;
	private typeFilter: string | null = null;
	private sortBy: "name" | "usage" = "name";
	private menuBtnEl: HTMLElement | null = null;

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

			this.deepToggleEl = searchContainer.createDiv("as-deep-toggle");
			setIcon(this.deepToggleEl, "file-search");
			this.deepToggleEl.setAttribute("aria-label", "Search file content");
			this.deepToggleEl.addEventListener("click", () => {
				this.store.setDeepSearch(!this.store.deepSearch);
				this.updateDeepToggle();
			});

			this.menuBtnEl = searchContainer.createDiv("as-list-menu-btn");
			setIcon(this.menuBtnEl, "sliders-horizontal");
			this.menuBtnEl.setAttribute("aria-label", "Filter & sort");
			this.menuBtnEl.addEventListener("click", (e) => {
				this.showMenu(e);
			});

			this.listEl = this.containerEl.createDiv("as-list-items");
		}

		this.inputEl.value = this.store.searchQuery;
		this.updateDeepToggle();
		this.updateMenuBtn();
		this.renderList();
	}

	private updateDeepToggle(): void {
		if (!this.deepToggleEl) return;
		this.deepToggleEl.toggleClass("is-active", this.store.deepSearch);
		this.deepToggleEl.setAttribute(
			"aria-label",
			this.store.deepSearch
				? "Deep search ON — searching file content"
				: "Deep search OFF — searching names only"
		);
	}

	private updateMenuBtn(): void {
		if (!this.menuBtnEl) return;
		const hasFilter = this.typeFilter !== null;
		const hasSort = this.sortBy !== "name";
		this.menuBtnEl.toggleClass("is-active", hasFilter || hasSort);
	}

	private showMenu(e: Event): void {
		const menu = new Menu();

		menu.addItem((i) =>
			i.setTitle("Sort by name")
				.setIcon("arrow-up-az")
				.setChecked(this.sortBy === "name")
				.onClick(() => {
					this.sortBy = "name";
					this.updateMenuBtn();
					this.renderList();
				})
		);
		menu.addItem((i) =>
			i.setTitle("Sort by usage")
				.setIcon("trending-up")
				.setChecked(this.sortBy === "usage")
				.onClick(() => {
					this.sortBy = "usage";
					this.updateMenuBtn();
					this.renderList();
				})
		);

		menu.addSeparator();

		const filters: { id: string; label: string }[] = [
			{ id: "all", label: "Show all" },
			{ id: "stale", label: "Stale only" },
			{ id: "heavy", label: "Heavy only" },
			{ id: "oversized", label: "Oversized only" },
			{ id: "conflict", label: "Conflicts only" },
		];

		for (const f of filters) {
			menu.addItem((i) =>
				i.setTitle(f.label)
					.setChecked(f.id === "all" ? !this.typeFilter : this.typeFilter === f.id)
					.onClick(() => {
						this.typeFilter = f.id === "all" ? null : f.id;
						this.updateMenuBtn();
						this.renderList();
					})
			);
		}

		if (e instanceof MouseEvent) {
			menu.showAtMouseEvent(e);
		}
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
				this.updateMenuBtn();
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

		card.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			const menu = new Menu();
			menu.addItem((i) =>
				i.setTitle("Reveal in system explorer")
					.setIcon("folder-open")
					.onClick(() => shell.showItemInFolder(item.filePath))
			);
			menu.addItem((i) =>
				i.setTitle("Copy file path")
					.setIcon("copy")
					.onClick(() => navigator.clipboard.writeText(item.filePath))
			);
			menu.showAtMouseEvent(e);
		});
	}
}
