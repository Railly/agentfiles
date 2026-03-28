import { Events } from "obsidian";
import { basename } from "path";
import type { SkillItem, SidebarFilter, ChopsSettings } from "./types";
import { scanAll } from "./scanner";
import { getSkillkitStats, isSkillkitAvailable } from "./skillkit";

export class SkillStore extends Events {
	private items: Map<string, SkillItem> = new Map();
	private _filter: SidebarFilter = { kind: "all" };
	private _searchQuery = "";
	private _deepSearch = false;

	get filter(): SidebarFilter {
		return this._filter;
	}

	get searchQuery(): string {
		return this._searchQuery;
	}

	get deepSearch(): boolean {
		return this._deepSearch;
	}

	get allItems(): SkillItem[] {
		return Array.from(this.items.values());
	}

	get filteredItems(): SkillItem[] {
		let result = this.allItems;

		switch (this._filter.kind) {
			case "favorites":
				result = result.filter((i) => i.isFavorite);
				break;
			case "tool":
				result = result.filter((i) =>
					i.tools.includes(this._filter.toolId)
				);
				break;
			case "type":
				result = result.filter((i) => i.type === this._filter.type);
				break;
			case "collection":
				result = result.filter((i) =>
					i.collections.includes(this._filter.name)
				);
				break;
			case "scope":
				result = result.filter((i) => i.scope === this._filter.scope);
				break;
			case "project":
				result = result.filter(
					(i) =>
						i.scope === "project" &&
						i.projectDir === this._filter.projectPath
				);
				break;
		}

		if (this._searchQuery) {
			const q = this._searchQuery.toLowerCase();
			result = result.filter((i) => {
				if (
					i.name.toLowerCase().includes(q) ||
					i.description.toLowerCase().includes(q) ||
					(i.projectName && i.projectName.toLowerCase().includes(q)) ||
					i.type.includes(q)
				) {
					return true;
				}
				return this._deepSearch && i.content.toLowerCase().includes(q);
			});
		}

		return result.sort((a, b) => a.name.localeCompare(b.name));
	}

	getItem(id: string): SkillItem | undefined {
		return this.items.get(id);
	}

	get hasSkillkit(): boolean {
		return isSkillkitAvailable();
	}

	refresh(settings: ChopsSettings): void {
		this.items = scanAll(settings);
		this.enrichWithSkillkit();
		this.trigger("updated");
	}

	private enrichWithSkillkit(): void {
		if (!isSkillkitAvailable()) return;
		const stats = getSkillkitStats();

		for (const item of this.items.values()) {
			const dirName = item.filePath.split("/").slice(-2, -1)[0];
			const baseName = item.name.toLowerCase().replace(/\s+/g, "-");

			const match = stats.get(item.name) || stats.get(dirName) || stats.get(baseName);
			if (match) {
				match.isHeavy = item.content.length > 5000;
				item.usage = match;
			} else {
				item.usage = {
					uses: 0,
					lastUsed: null,
					daysSinceUsed: null,
					isStale: false,
					isHeavy: item.content.length > 5000,
				};
			}
		}
	}

	setFilter(filter: SidebarFilter): void {
		this._filter = filter;
		this.trigger("updated");
	}

	setSearch(query: string): void {
		this._searchQuery = query;
		this.trigger("updated");
	}

	setDeepSearch(enabled: boolean): void {
		this._deepSearch = enabled;
		if (this._searchQuery) {
			this.trigger("updated");
		}
	}

	toggleFavorite(id: string, settings: ChopsSettings): void {
		const item = this.items.get(id);
		if (!item) return;
		item.isFavorite = !item.isFavorite;
		if (item.isFavorite) {
			if (!settings.favorites.includes(id)) settings.favorites.push(id);
		} else {
			settings.favorites = settings.favorites.filter((f) => f !== id);
		}
		this.trigger("updated");
	}

	getToolCounts(): Map<string, number> {
		const counts = new Map<string, number>();
		for (const item of this.items.values()) {
			for (const tool of item.tools) {
				counts.set(tool, (counts.get(tool) || 0) + 1);
			}
		}
		return counts;
	}

	getTypeCounts(): Map<string, number> {
		const counts = new Map<string, number>();
		for (const item of this.items.values()) {
			counts.set(item.type, (counts.get(item.type) || 0) + 1);
		}
		return counts;
	}

	getScopeCounts(): { global: number; project: number } {
		let global = 0;
		let project = 0;
		for (const item of this.items.values()) {
			if (item.scope === "project") project++;
			else global++;
		}
		return { global, project };
	}

	getProjectCounts(): Map<string, { name: string; count: number }> {
		const counts = new Map<string, { name: string; count: number }>();
		for (const item of this.items.values()) {
			if (item.scope === "project" && item.projectDir) {
				const existing = counts.get(item.projectDir);
				if (existing) {
					existing.count++;
				} else {
					counts.set(item.projectDir, {
						name: item.projectName || basename(item.projectDir),
						count: 1,
					});
				}
			}
		}
		return counts;
	}
}
