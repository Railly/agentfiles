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
	private deepToggleEl: HTMLElement | null = null;
	private listContainerEl: HTMLElement | null = null;
	private initialized = false;

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
		this.containerEl.addClass("as-list");

		if (!this.initialized) {
			this.containerEl.empty();
			const searchContainer = this.containerEl.createDiv("as-search");
			this.inputEl = searchContainer.createEl("input", {
				type: "text",
				placeholder: this.getSearchPlaceholder(),
				cls: "as-search-input",
			});
			this.inputEl.value = this.store.searchQuery;
			this.inputEl.addEventListener("input", () => {
				this.store.setSearch(this.inputEl!.value);
			});

			this.deepToggleEl = searchContainer.createEl("button", {
				cls: "as-deep-toggle",
				attr: {
					"aria-label": "Toggle deep search (search file contents)",
				},
			});
			setIcon(this.deepToggleEl, "search-code");
			this.deepToggleEl.addEventListener("click", () => {
				this.store.setDeepSearch(!this.store.deepSearch);
			});

			this.listContainerEl = this.containerEl.createDiv("as-list-items");
			this.initialized = true;
		}

		// Update placeholder and deep search state
		this.inputEl!.placeholder = this.getSearchPlaceholder();
		this.deepToggleEl!.toggleClass("is-active", this.store.deepSearch);
		this.deepToggleEl!.setAttribute(
			"aria-label",
			this.store.deepSearch ? "Deep search ON (searching file contents)" : "Deep search OFF (listing fields only)"
		);

		// Re-render only the list items
		this.renderItems();
	}

	private renderItems(): void {
		const container = this.listContainerEl!;
		container.empty();

		const items = this.store.filteredItems;

		if (items.length === 0) {
			container.createDiv({
				cls: "as-list-empty",
				text: "No agent files found",
			});
			return;
		}

		for (const item of items) {
			this.renderCard(container, item);
		}
	}

	private getSearchPlaceholder(): string {
		const filter = this.store.filter;
		switch (filter.kind) {
			case "type": {
				const labels: Record<string, string> = {
					skill: "skills", command: "commands", agent: "agents", rule: "rules", memory: "memories",
				};
				return `Search ${labels[filter.type] || filter.type}...`;
			}
			case "tool": {
				const tool = TOOL_CONFIGS.find((t) => t.id === filter.toolId);
				return `Search ${tool?.name || filter.toolId} files...`;
			}
			case "favorites":
				return "Search favorites...";
			case "scope":
				return `Search ${filter.scope} agent files...`;
			case "project":
				return `Search project files...`;
			case "collection":
				return `Search ${filter.name}...`;
			default:
				return "Search agent files...";
		}
	}

	private renderCard(container: HTMLElement, item: SkillItem): void {
		const card = container.createDiv("as-skill-card");
		if (item.id === this.selectedId) card.addClass("is-selected");

		const header = card.createDiv("as-skill-header");
		header.createSpan({ cls: "as-skill-name", text: item.name });

		if (item.scope === "project" && item.projectName) {
			header.createSpan({ cls: "as-project-badge", text: item.projectName });
		} else if (item.scope === "global") {
			const globeEl = header.createSpan("as-global-icon");
			setIcon(globeEl, "globe");
		}

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
			if (TOOL_SVGS[toolId]) {
				badge.style.color = tool.color;
				renderToolIcon(badge, toolId, 12);
			} else {
				badge.style.backgroundColor = tool.color;
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

		card.addEventListener("click", () => {
			this.selectedId = item.id;
			this.onSelect(item);
		});
	}
}
