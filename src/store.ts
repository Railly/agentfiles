import { Events } from "obsidian";
import { sep } from "path";
import type { SkillItem, SidebarFilter, DeepSearchScope, ChopsSettings } from "./types";
import { scanAll, getProjectName } from "./scanner";
import { getSkillkitStatsWithDaily, getSkillConflicts, getSkillWarnings, isSkillkitAvailable } from "./skillkit";

export class SkillStore extends Events {
	private items: Map<string, SkillItem> = new Map();
	private _filter: SidebarFilter = { kind: "all" };
	private _searchQuery = "";
	private _deepSearch = false;
	private _deepSearchScope: DeepSearchScope = "both";
	private _projectsHomeDir = "";

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
			case "project":
				result = result.filter(
					(i) => getProjectName(i.filePath, this._projectsHomeDir) === this._filter.project
				);
				break;
		}

		if (this._searchQuery) {
			const q = this._searchQuery.toLowerCase();
			const searchDesc = this._deepSearch && (this._deepSearchScope === "description" || this._deepSearchScope === "both");
			const searchContent = this._deepSearch && (this._deepSearchScope === "content" || this._deepSearchScope === "both");
			result = result.filter(
				(i) =>
					i.name.toLowerCase().includes(q) ||
					(searchDesc && i.description.toLowerCase().includes(q)) ||
					(searchContent && i.content.toLowerCase().includes(q))
			);
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
		this._projectsHomeDir = settings.projectsHomeDir;
		this.items = scanAll(settings);
		this.trigger("updated");
		this.deferEnrichment();
	}

	private _enrichTimer: ReturnType<typeof setTimeout> | null = null;

	private deferEnrichment(): void {
		if (this._enrichTimer) clearTimeout(this._enrichTimer);
		this._enrichTimer = setTimeout(() => {
			this._enrichTimer = null;
			this.enrichWithSkillkit();
			this.trigger("updated");
		}, 50);
	}

	private enrichWithSkillkit(): void {
		if (!isSkillkitAvailable()) return;
		const stats = getSkillkitStatsWithDaily();
		const conflicts = getSkillConflicts();
		const warnings = getSkillWarnings();

		const oversizedSet = new Set(warnings.oversized.map((w) => w.name));
		const longDescSet = new Set(warnings.longDesc.map((w) => w.name));
		const oversizedMap = new Map(warnings.oversized.map((w) => [w.name, w.lines]));
		const longDescMap = new Map(warnings.longDesc.map((w) => [w.name, w.chars]));

		for (const item of this.items.values()) {
			const dirName = item.filePath.split(sep).slice(-2, -1)[0];
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
					isStale: true,
					isHeavy: item.content.length > 5000,
				};
			}

			const lineCount = item.content.split("\n").length;
			const descLen = item.description.length;
			item.warnings = {
				oversized: oversizedSet.has(item.name) || lineCount > 500,
				longDesc: longDescSet.has(item.name) || descLen > 1024,
				lineCount: oversizedMap.get(item.name) ?? lineCount,
				descChars: longDescMap.get(item.name) ?? descLen,
			};

			item.conflicts = conflicts.get(item.name) || conflicts.get(dirName) || [];
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
		if (this._deepSearch === enabled) return;
		this._deepSearch = enabled;
		this.trigger("updated");
	}

	setDeepSearchScope(scope: DeepSearchScope): void {
		if (this._deepSearchScope === scope) return;
		this._deepSearchScope = scope;
		this.trigger("updated");
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

	getProjectCounts(): Map<string, number> {
		const counts = new Map<string, number>();
		for (const item of this.items.values()) {
			const project = getProjectName(item.filePath, this._projectsHomeDir);
			counts.set(project, (counts.get(project) || 0) + 1);
		}
		return counts;
	}
}
