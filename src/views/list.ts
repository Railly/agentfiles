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
	private listEl: HTMLElement | null = null;
	private typeFilter: string | null = null;
	private sortBy: "name" | "usage" = "name";
	private openDropdown: "menu" | null = null;
	private menuDropdownEl: HTMLElement | null = null;
	private outsideClickCleanup: (() => void) | null = null;

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

			const actions = searchContainer.createDiv("as-conv-search-actions");

			const deepBtn = actions.createEl("button", { cls: "as-conv-icon-btn" });
			const deepIco = deepBtn.createSpan("as-conv-icon-btn-icon");
			setIcon(deepIco, "file-search");
			deepBtn.setAttribute("aria-label", "Search file content");
			if (this.store.deepSearch) deepBtn.addClass("has-active");
			deepBtn.addEventListener("click", () => {
				this.store.setDeepSearch(!this.store.deepSearch);
				deepBtn.toggleClass("has-active", this.store.deepSearch);
			});

			const menuWrapper = actions.createDiv("as-conv-dropdown-wrap");
			const menuBtn = menuWrapper.createEl("button", { cls: "as-conv-icon-btn" });
			const menuIco = menuBtn.createSpan("as-conv-icon-btn-icon");
			setIcon(menuIco, "sliders-horizontal");
			menuBtn.setAttribute("aria-label", "Filter & sort");
			if (this.typeFilter || this.sortBy !== "name") menuBtn.addClass("has-active");

			this.menuDropdownEl = menuWrapper.createDiv("as-conv-dropdown as-conv-dropdown-wide");
			this.renderMenuDropdown();

			menuBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				if (this.openDropdown === "menu") {
					this.closeDropdown();
				} else {
					this.closeDropdown();
					this.openDropdown = "menu";
					this.menuDropdownEl?.addClass("is-open");
					const close = (ev: MouseEvent) => {
						if (!menuWrapper.contains(ev.target as Node)) {
							this.closeDropdown();
						}
					};
					setTimeout(() => document.addEventListener("click", close), 0);
					this.outsideClickCleanup = () => document.removeEventListener("click", close);
				}
			});

			this.listEl = this.containerEl.createDiv("as-list-items");
		}

		this.inputEl.value = this.store.searchQuery;
		this.renderList();
	}

	private closeDropdown(): void {
		this.openDropdown = null;
		this.menuDropdownEl?.removeClass("is-open");
		if (this.outsideClickCleanup) {
			this.outsideClickCleanup();
			this.outsideClickCleanup = null;
		}
	}

	private renderMenuDropdown(): void {
		if (!this.menuDropdownEl) return;
		this.menuDropdownEl.empty();

		const sortHeader = this.menuDropdownEl.createDiv("as-conv-dropdown-header");
		sortHeader.setText("Sort");

		const sorts: { label: string; value: "name" | "usage"; icon: string }[] = [
			{ label: "Name", value: "name", icon: "arrow-up-az" },
			{ label: "Usage", value: "usage", icon: "trending-up" },
		];
		for (const s of sorts) {
			const item = this.menuDropdownEl.createDiv(`as-conv-dropdown-item ${this.sortBy === s.value ? "is-active" : ""}`);
			const check = item.createSpan("as-conv-dropdown-check");
			if (this.sortBy === s.value) setIcon(check, "check");
			item.createSpan({ cls: "as-conv-dropdown-item-label", text: s.label });
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.sortBy = s.value;
				this.updateMenuBtnState();
				this.renderMenuDropdown();
				this.renderList();
			});
		}

		const filterHeader = this.menuDropdownEl.createDiv("as-conv-dropdown-header");
		filterHeader.setText("Filter");

		const filters: { id: string | null; label: string }[] = [
			{ id: null, label: "All" },
			{ id: "stale", label: "Stale" },
			{ id: "heavy", label: "Heavy" },
			{ id: "oversized", label: "Oversized" },
			{ id: "conflict", label: "Conflicts" },
		];
		for (const f of filters) {
			const isActive = this.typeFilter === f.id;
			const item = this.menuDropdownEl.createDiv(`as-conv-dropdown-item ${isActive ? "is-active" : ""}`);
			const check = item.createSpan("as-conv-dropdown-check");
			if (isActive) setIcon(check, "check");
			item.createSpan({ cls: "as-conv-dropdown-item-label", text: f.label });
			item.addEventListener("click", (e) => {
				e.stopPropagation();
				this.typeFilter = f.id;
				this.updateMenuBtnState();
				this.renderMenuDropdown();
				this.renderList();
			});
		}
	}

	private updateMenuBtnState(): void {
		const menuBtn = this.containerEl.querySelector(".as-conv-dropdown-wrap .as-conv-icon-btn");
		if (menuBtn) {
			const isActive = this.typeFilter !== null || this.sortBy !== "name";
			menuBtn.toggleClass("has-active", isActive);
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
