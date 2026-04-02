import { Events } from "obsidian";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { ConversationItem, ConversationFilter, ConversationTagData } from "../types";
import { DEFAULT_CONVERSATION_TAG_DATA } from "../types";
import { parseAllConversations } from "./parser";
import { tagAllConversations } from "./tagger";

const TAG_FILE = join(homedir(), ".claude", "agentfiles-conversations.json");

export class ConversationStore extends Events {
	private items: ConversationItem[] = [];
	private _filter: ConversationFilter = { kind: "all-conversations" };
	private _searchQuery = "";
	private tagData: ConversationTagData = { ...DEFAULT_CONVERSATION_TAG_DATA };

	get filter(): ConversationFilter {
		return this._filter;
	}

	get searchQuery(): string {
		return this._searchQuery;
	}

	get allItems(): ConversationItem[] {
		return this.items;
	}

	get filteredItems(): ConversationItem[] {
		let result = this.items;

		switch (this._filter.kind) {
			case "conversation-project":
				result = result.filter((c) => c.project === this._filter.project);
				break;
			case "conversation-tag":
				result = result.filter(
					(c) => c.tags.includes(this._filter.tag) || c.customTags.includes(this._filter.tag)
				);
				break;
			case "conversation-favorites":
				result = result.filter((c) => c.isFavorite);
				break;
		}

		if (this._searchQuery) {
			const q = this._searchQuery.toLowerCase();
			result = result.filter(
				(c) =>
					c.title.toLowerCase().includes(q) ||
					c.project.toLowerCase().includes(q) ||
					c.tags.some((t) => t.includes(q)) ||
					c.customTags.some((t) => t.includes(q))
			);
		}

		return result;
	}

	getProjectCounts(): Map<string, number> {
		const counts = new Map<string, number>();
		for (const item of this.items) {
			counts.set(item.project, (counts.get(item.project) || 0) + 1);
		}
		return counts;
	}

	getAllTags(): Map<string, number> {
		const counts = new Map<string, number>();
		for (const item of this.items) {
			for (const tag of [...item.tags, ...item.customTags]) {
				counts.set(tag, (counts.get(tag) || 0) + 1);
			}
		}
		return counts;
	}

	refresh(): void {
		this.loadTagData();
		this.items = parseAllConversations();
		tagAllConversations(this.items);
		this.applyTagData();
		this.trigger("conversations-updated");
	}

	private loadTagData(): void {
		try {
			if (existsSync(TAG_FILE)) {
				this.tagData = JSON.parse(readFileSync(TAG_FILE, "utf-8"));
			}
		} catch {
			this.tagData = { ...DEFAULT_CONVERSATION_TAG_DATA };
		}
	}

	private saveTagData(): void {
		try {
			writeFileSync(TAG_FILE, JSON.stringify(this.tagData, null, 2), "utf-8");
		} catch {
			/* silent */
		}
	}

	private applyTagData(): void {
		for (const item of this.items) {
			item.customTags = this.tagData.customTags[item.uuid] || [];
			item.isFavorite = this.tagData.favorites.includes(item.uuid);
		}
	}

	setFilter(filter: ConversationFilter): void {
		this._filter = filter;
		this.trigger("conversations-updated");
	}

	setSearch(query: string): void {
		this._searchQuery = query;
		this.trigger("conversations-updated");
	}

	toggleFavorite(uuid: string): void {
		const idx = this.tagData.favorites.indexOf(uuid);
		if (idx >= 0) {
			this.tagData.favorites.splice(idx, 1);
		} else {
			this.tagData.favorites.push(uuid);
		}
		this.saveTagData();

		const item = this.items.find((c) => c.uuid === uuid);
		if (item) item.isFavorite = !item.isFavorite;
		this.trigger("conversations-updated");
	}

	addCustomTag(uuid: string, tag: string): void {
		if (!this.tagData.customTags[uuid]) {
			this.tagData.customTags[uuid] = [];
		}
		const tags = this.tagData.customTags[uuid];
		if (!tags.includes(tag)) {
			tags.push(tag);
		}
		this.saveTagData();

		const item = this.items.find((c) => c.uuid === uuid);
		if (item && !item.customTags.includes(tag)) {
			item.customTags.push(tag);
		}
		this.trigger("conversations-updated");
	}

	removeCustomTag(uuid: string, tag: string): void {
		if (this.tagData.customTags[uuid]) {
			this.tagData.customTags[uuid] = this.tagData.customTags[uuid].filter((t) => t !== tag);
		}
		this.saveTagData();

		const item = this.items.find((c) => c.uuid === uuid);
		if (item) {
			item.customTags = item.customTags.filter((t) => t !== tag);
		}
		this.trigger("conversations-updated");
	}

	getItem(uuid: string): ConversationItem | undefined {
		return this.items.find((c) => c.uuid === uuid);
	}
}
