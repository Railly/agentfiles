import { Events } from "obsidian";
import { sep, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import type { SkillItem, SidebarFilter, DeepSearchScope, ChopsSettings } from "./types";
import { scanAll, getProjectName } from "./scanner";
import { getSkillkitStatsWithDailyAsync, getSkillConflictsAsync, getSkillWarningsAsync, isSkillkitAvailable } from "./skillkit";
import type { SkillkitStatsWithDaily } from "./skillkit";

const ENRICH_CACHE = join(homedir(), ".skillkit", "enrichment-cache.json");

interface EnrichmentData {
	stats: Record<string, SkillkitStatsWithDaily>;
	conflicts: Record<string, { skillName: string; similarity: number }[]>;
	warnings: { oversized: { name: string; lines: number }[]; longDesc: { name: string; chars: number }[] };
}

function loadEnrichmentCache(): EnrichmentData | null {
	if (!existsSync(ENRICH_CACHE)) return null;
	try {
		return JSON.parse(readFileSync(ENRICH_CACHE, "utf-8"));
	} catch { return null; }
}

function saveEnrichmentCache(data: EnrichmentData): void {
	try {
		writeFileSync(ENRICH_CACHE, JSON.stringify(data), "utf-8");
	} catch { /* empty */ }
}

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

	private _enrichGeneration = 0;

	refresh(settings: ChopsSettings): void {
		this._projectsHomeDir = settings.projectsHomeDir;
		this.items = scanAll(settings);
		if (isSkillkitAvailable()) {
			this.applyEnrichmentFromCache();
		}
		this.trigger("updated");
	}

	revalidate(): void {
		if (!isSkillkitAvailable()) return;
		void this.revalidateAsync();
	}

	private applyEnrichmentFromCache(): void {
		const cached = loadEnrichmentCache();
		if (!cached) return;
		const stats = new Map(Object.entries(cached.stats));
		const conflicts = new Map(Object.entries(cached.conflicts));
		this.applyEnrichment(stats, conflicts, cached.warnings);
	}

	private async revalidateAsync(): Promise<void> {
		const gen = ++this._enrichGeneration;
		const [stats, conflicts, warnings] = await Promise.all([
			getSkillkitStatsWithDailyAsync(),
			getSkillConflictsAsync(),
			getSkillWarningsAsync(),
		]);
		if (gen !== this._enrichGeneration) return;
		this.applyEnrichment(stats, conflicts, warnings);
		this.trigger("updated");
		saveEnrichmentCache({
			stats: Object.fromEntries(stats),
			conflicts: Object.fromEntries(conflicts),
			warnings,
		});
	}

	private applyEnrichment(
		stats: Map<string, SkillkitStatsWithDaily>,
		conflicts: Map<string, { skillName: string; similarity: number }[]>,
		warnings: { oversized: { name: string; lines: number }[]; longDesc: { name: string; chars: number }[] }
	): void {
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
