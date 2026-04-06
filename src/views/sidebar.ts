import { setIcon } from "obsidian";
import { shell } from "electron";
import { TOOL_CONFIGS } from "../tool-configs";
import { TOOL_SVGS, renderToolIcon } from "../tool-icons";
import type { SkillStore } from "../store";
import type { SidebarFilter, SkillType } from "../types";
import type { ConversationStore } from "../conversations/store";

export class SidebarPanel {
	private containerEl: HTMLElement;
	private store: SkillStore;
	private onToggleDashboard: () => void;
	private onToggleMarketplace: () => void;
	private onCreateSkill: () => void;
	private onToggleConversations: () => void;
	private conversationStore: ConversationStore | null;
	private dashboardActive = false;
	private marketplaceActive = false;
	private conversationsActive = false;

	constructor(
		containerEl: HTMLElement,
		store: SkillStore,
		onToggleDashboard: () => void,
		onToggleMarketplace: () => void,
		onCreateSkill: () => void,
		onToggleConversations?: () => void,
		conversationStore?: ConversationStore
	) {
		this.containerEl = containerEl;
		this.store = store;
		this.onToggleDashboard = onToggleDashboard;
		this.onToggleMarketplace = onToggleMarketplace;
		this.onCreateSkill = onCreateSkill;
		this.onToggleConversations = onToggleConversations || (() => {});
		this.conversationStore = conversationStore || null;
	}

	setDashboardActive(active: boolean): void {
		this.dashboardActive = active;
	}

	setMarketplaceActive(active: boolean): void {
		this.marketplaceActive = active;
	}

	setConversationsActive(active: boolean): void {
		this.conversationsActive = active;
	}

	render(): void {
		this.containerEl.empty();
		this.containerEl.addClass("as-sidebar");

		this.renderLibrarySection();

		if (this.conversationsActive && this.conversationStore) {
			this.renderConversationFilters();
		} else {
			this.renderTypeSection();
			this.renderToolSection();
			this.renderProjectSection();
			this.renderCollectionSection();

			if (!this.store.hasSkillkit) {
				this.renderSkillkitCta();
			}
		}
	}

	private renderSection(
		title: string,
		items: { label: string; icon: string; filter: SidebarFilter; count?: number }[]
	): void {
		const section = this.containerEl.createDiv("as-sidebar-section");
		section.createDiv({ cls: "as-sidebar-title", text: title });

		for (const item of items) {
			const row = section.createDiv("as-sidebar-item");
			if (!this.dashboardActive && this.isActive(item.filter)) row.addClass("is-active");

			const iconEl = row.createSpan("as-sidebar-icon");
			setIcon(iconEl, item.icon);
			row.createSpan({ cls: "as-sidebar-label", text: item.label });

			if (item.count !== undefined) {
				row.createSpan({
					cls: "as-sidebar-count",
					text: String(item.count),
				});
			}

			row.addEventListener("click", () => {
				if (this.dashboardActive) this.onToggleDashboard();
				if (this.marketplaceActive) this.onToggleMarketplace();
				this.store.setFilter(item.filter);
			});
		}
	}

	private renderTypeSection(): void {
		const typeCounts = this.store.getTypeCounts();
		const types: { label: string; icon: string; type: SkillType }[] = [
			{ label: "Skills", icon: "sparkles", type: "skill" },
			{ label: "Commands", icon: "terminal", type: "command" },
			{ label: "Agents", icon: "bot", type: "agent" },
			{ label: "Rules", icon: "scroll", type: "rule" },
		];

		const items = types
			.filter((t) => typeCounts.has(t.type))
			.map((t) => ({
				label: t.label,
				icon: t.icon,
				filter: { kind: "type" as const, type: t.type },
				count: typeCounts.get(t.type) || 0,
			}));

		if (items.length > 0) {
			this.renderSection("Types", items);
		}
	}

	private renderToolSection(): void {
		const toolCounts = this.store.getToolCounts();
		const tools = TOOL_CONFIGS.filter(
			(t) => t.isInstalled() && toolCounts.has(t.id)
		);

		if (tools.length === 0) return;

		const section = this.containerEl.createDiv("as-sidebar-section");
		section.createDiv({ cls: "as-sidebar-title", text: "Tools" });

		for (const tool of tools) {
			const filter: SidebarFilter = { kind: "tool", toolId: tool.id };
			const row = section.createDiv("as-sidebar-item");
			if (!this.dashboardActive && this.isActive(filter)) row.addClass("is-active");

			const iconEl = row.createSpan("as-sidebar-icon");
			if (TOOL_SVGS[tool.id]) {
				renderToolIcon(iconEl, tool.id, 14);
			} else {
				setIcon(iconEl, tool.icon);
			}

			row.createSpan({ cls: "as-sidebar-label", text: tool.name });
			row.createSpan({
				cls: "as-sidebar-count",
				text: String(toolCounts.get(tool.id) || 0),
			});

			row.addEventListener("click", () => {
				if (this.dashboardActive) this.onToggleDashboard();
				this.store.setFilter(filter);
			});
		}
	}

	private renderProjectSection(): void {
		const projectCounts = this.store.getProjectCounts();
		if (projectCounts.size === 0) return;

		const items: { label: string; icon: string; filter: SidebarFilter; count: number }[] = [];
		for (const [project, count] of projectCounts) {
			items.push({
				label: project,
				icon: "folder-git-2",
				filter: { kind: "project", project },
				count,
			});
		}
		items.sort((a, b) => a.label.localeCompare(b.label));
		this.renderSection("Projects", items);
	}

	private renderCollectionSection(): void {
		const section = this.containerEl.createDiv("as-sidebar-section");
		section.createDiv({ cls: "as-sidebar-title", text: "Collections" });

		const collections = new Set<string>();
		for (const item of this.store.allItems) {
			for (const c of item.collections) collections.add(c);
		}

		if (collections.size === 0) {
			section.createDiv({
				cls: "as-sidebar-empty",
				text: "No collections yet",
			});
			return;
		}

		for (const name of collections) {
			const filter: SidebarFilter = { kind: "collection", name };
			const row = section.createDiv("as-sidebar-item");
			if (!this.dashboardActive && this.isActive(filter)) row.addClass("is-active");

			const iconEl = row.createSpan("as-sidebar-icon");
			setIcon(iconEl, "folder");
			row.createSpan({ cls: "as-sidebar-label", text: name });

			row.addEventListener("click", () => {
				if (this.dashboardActive) this.onToggleDashboard();
				this.store.setFilter(filter);
			});
		}
	}

	private renderLibrarySection(): void {
		const section = this.containerEl.createDiv("as-sidebar-section");
		section.createDiv({ cls: "as-sidebar-title", text: "Library" });

		const libraryItems: { label: string; icon: string; filter: SidebarFilter }[] = [
			{ label: "All Skills", icon: "layers", filter: { kind: "all" } },
			{ label: "Favorites", icon: "star", filter: { kind: "favorites" } },
		];

		const isSpecialView = this.dashboardActive || this.marketplaceActive || this.conversationsActive;

		for (const item of libraryItems) {
			const row = section.createDiv("as-sidebar-item");
			if (!isSpecialView && this.isActive(item.filter)) row.addClass("is-active");

			const iconEl = row.createSpan("as-sidebar-icon");
			setIcon(iconEl, item.icon);
			row.createSpan({ cls: "as-sidebar-label", text: item.label });

			row.addEventListener("click", () => {
				if (this.dashboardActive) this.onToggleDashboard();
				if (this.marketplaceActive) this.onToggleMarketplace();
				if (this.conversationsActive) this.onToggleConversations();
				this.store.setFilter(item.filter);
			});
		}

		const dashRow = section.createDiv("as-sidebar-item");
		if (this.dashboardActive) dashRow.addClass("is-active");
		const dashIcon = dashRow.createSpan("as-sidebar-icon");
		setIcon(dashIcon, "bar-chart-2");
		dashRow.createSpan({ cls: "as-sidebar-label", text: "Dashboard" });
		dashRow.addEventListener("click", () => {
			if (this.marketplaceActive) this.onToggleMarketplace();
			if (this.conversationsActive) this.onToggleConversations();
			if (!this.dashboardActive) this.onToggleDashboard();
		});

		const mpRow = section.createDiv("as-sidebar-item");
		if (this.marketplaceActive) mpRow.addClass("is-active");
		const mpIcon = mpRow.createSpan("as-sidebar-icon");
		setIcon(mpIcon, "shopping-bag");
		mpRow.createSpan({ cls: "as-sidebar-label", text: "Marketplace" });
		mpRow.addEventListener("click", () => {
			if (this.dashboardActive) this.onToggleDashboard();
			if (this.conversationsActive) this.onToggleConversations();
			if (!this.marketplaceActive) this.onToggleMarketplace();
		});

		const convRow = section.createDiv("as-sidebar-item");
		if (this.conversationsActive) convRow.addClass("is-active");
		const convIcon = convRow.createSpan("as-sidebar-icon");
		setIcon(convIcon, "message-circle");
		convRow.createSpan({ cls: "as-sidebar-label", text: "Conversations" });
		convRow.addEventListener("click", () => {
			if (this.dashboardActive) this.onToggleDashboard();
			if (this.marketplaceActive) this.onToggleMarketplace();
			if (!this.conversationsActive) this.onToggleConversations();
		});

		const createRow = section.createDiv("as-sidebar-item as-sidebar-create");
		const createIcon = createRow.createSpan("as-sidebar-icon");
		setIcon(createIcon, "plus");
		createRow.createSpan({ cls: "as-sidebar-label", text: "Create" });
		createRow.addEventListener("click", () => this.onCreateSkill());
	}

	private renderSkillkitCta(): void {
		const cta = this.containerEl.createDiv("as-skillkit-cta");
		const iconEl = cta.createDiv("as-skillkit-icon");
		setIcon(iconEl, "bar-chart-2");
		cta.createDiv({ cls: "as-skillkit-title", text: "Unlock analytics" });
		cta.createDiv({
			cls: "as-skillkit-desc",
			text: "Install skillkit to see usage stats, stale badges, and heavy skill warnings.",
		});
		const cmd = cta.createDiv("as-skillkit-cmd");
		cmd.createEl("code", { text: "npm i -g @crafter/skillkit" });
		const link = cta.createEl("a", {
			cls: "as-skillkit-link",
			text: "Learn more",
			href: "https://www.npmjs.com/package/@crafter/skillkit",
		});
		link.addEventListener("click", (e) => {
			e.preventDefault();
			void shell.openExternal("https://www.npmjs.com/package/@crafter/skillkit");
		});
	}

	private renderConversationFilters(): void {
		if (!this.conversationStore) return;

		// Projects
		const projCounts = this.conversationStore.getProjectCounts();
		if (projCounts.size > 0) {
			const section = this.containerEl.createDiv("as-sidebar-section");
			section.createDiv({ cls: "as-sidebar-title", text: "Projects" });

			const allRow = section.createDiv("as-sidebar-item");
			const convFilter = this.conversationStore.filter;
			if (convFilter.kind === "all-conversations") allRow.addClass("is-active");
			const allIcon = allRow.createSpan("as-sidebar-icon");
			setIcon(allIcon, "layers");
			allRow.createSpan({ cls: "as-sidebar-label", text: "All" });
			allRow.createSpan({ cls: "as-sidebar-count", text: String(this.conversationStore.allItems.length) });
			allRow.addEventListener("click", () => {
				this.conversationStore!.setFilter({ kind: "all-conversations" });
			});

			const favRow = section.createDiv("as-sidebar-item");
			if (convFilter.kind === "conversation-favorites") favRow.addClass("is-active");
			const favIcon = favRow.createSpan("as-sidebar-icon");
			setIcon(favIcon, "star");
			favRow.createSpan({ cls: "as-sidebar-label", text: "Favorites" });
			favRow.addEventListener("click", () => {
				this.conversationStore!.setFilter({ kind: "conversation-favorites" });
			});

			for (const [project, count] of Array.from(projCounts.entries()).sort((a, b) => b[1] - a[1])) {
				const row = section.createDiv("as-sidebar-item");
				if (convFilter.kind === "conversation-project" && convFilter.project === project) {
					row.addClass("is-active");
				}
				const icon = row.createSpan("as-sidebar-icon");
				setIcon(icon, "folder-git-2");
				row.createSpan({ cls: "as-sidebar-label", text: project });
				row.createSpan({ cls: "as-sidebar-count", text: String(count) });
				row.addEventListener("click", () => {
					this.conversationStore!.setFilter({ kind: "conversation-project", project });
				});
			}
		}

	}

	private isActive(filter: SidebarFilter): boolean {
		const current = this.store.filter;
		if (current.kind !== filter.kind) return false;
		if (current.kind === "tool" && filter.kind === "tool")
			return current.toolId === filter.toolId;
		if (current.kind === "type" && filter.kind === "type")
			return current.type === filter.type;
		if (current.kind === "collection" && filter.kind === "collection")
			return current.name === filter.name;
		if (current.kind === "project" && filter.kind === "project")
			return current.project === filter.project;
		return true;
	}
}
