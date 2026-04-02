import { ItemView, type WorkspaceLeaf, type FileSystemAdapter } from "obsidian";
import type { SkillStore } from "../store";
import type { SkillItem, ChopsSettings, ConversationItem } from "../types";
import { SidebarPanel } from "./sidebar";
import { ListPanel } from "./list";
import { DetailPanel } from "./detail";
import { DashboardPanel } from "./dashboard";
import { MarketplacePanel } from "./marketplace-view";
import { CreateSkillModal } from "./create-skill-modal";
import { ConversationStore } from "../conversations/store";
import { ConversationListPanel } from "./conversation-list";
import { ConversationDetailPanel } from "./conversation-detail";

export const VIEW_TYPE = "agentfiles-view";

export class AgentfilesView extends ItemView {
	private store: SkillStore;
	private settings: ChopsSettings;
	private saveSettings: () => Promise<void>;

	private sidebarPanel!: SidebarPanel;
	private listPanel!: ListPanel;
	private detailPanel!: DetailPanel;
	private dashboardPanel!: DashboardPanel;
	private marketplacePanel!: MarketplacePanel;

	private conversationStore: ConversationStore = new ConversationStore();
	private convListPanel!: ConversationListPanel;
	private convDetailPanel!: ConversationDetailPanel;

	private sidebarEl!: HTMLElement;
	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;
	private dashboardEl!: HTMLElement;
	private marketplaceEl!: HTMLElement;
	// Conversation panels live inside listEl/detailEl as child containers
	private convListWrapperEl!: HTMLElement;
	private convDetailWrapperEl!: HTMLElement;
	// Skill panels wrappers (to toggle visibility within the same grid cell)
	private skillListWrapperEl!: HTMLElement;
	private skillDetailWrapperEl!: HTMLElement;
	private resizeHandle1!: HTMLElement;
	private resizeHandle2!: HTMLElement;

	private isDashboard = false;
	private isMarketplace = false;
	private isConversations = false;
	private updateRef: ReturnType<typeof this.store.on> | null = null;
	private convUpdateRef: ReturnType<typeof this.conversationStore.on> | null = null;
	private dragCleanup: (() => void) | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		store: SkillStore,
		settings: ChopsSettings,
		saveSettings: () => Promise<void>
	) {
		super(leaf);
		this.store = store;
		this.settings = settings;
		this.saveSettings = saveSettings;
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Agentfiles";
	}

	getIcon(): string {
		return "cpu";
	}

	onOpen(): void {
		const container = this.contentEl;
		container.empty();
		container.addClass("as-container");

		this.sidebarEl = container.createDiv("as-panel as-panel-sidebar");
		this.resizeHandle1 = this.createResizeHandle(container, this.sidebarEl, "--as-sidebar-width", 120, 400);
		this.listEl = container.createDiv("as-panel as-panel-list");
		this.resizeHandle2 = this.createResizeHandle(container, this.listEl, "--as-list-width", 180, 600);
		this.detailEl = container.createDiv("as-panel as-panel-detail");
		this.dashboardEl = container.createDiv("as-panel as-panel-dashboard as-hidden");
		this.marketplaceEl = container.createDiv("as-panel as-panel-marketplace as-hidden");

		// Create wrappers inside list/detail for skills vs conversations
		this.skillListWrapperEl = this.listEl.createDiv("as-wrapper");
		this.convListWrapperEl = this.listEl.createDiv("as-wrapper as-hidden");
		this.skillDetailWrapperEl = this.detailEl.createDiv("as-wrapper");
		this.convDetailWrapperEl = this.detailEl.createDiv("as-wrapper as-hidden");

		const vaultPath = (this.app.vault.adapter as FileSystemAdapter).getBasePath?.() || "";

		this.sidebarPanel = new SidebarPanel(
			this.sidebarEl,
			this.store,
			() => this.toggleDashboard(),
			() => this.toggleMarketplace(),
			() => this.openCreateModal(),
			() => this.toggleConversations(),
			this.conversationStore
		);
		this.listPanel = new ListPanel(this.skillListWrapperEl, this.store, (item: SkillItem) =>
			this.onSelectItem(item)
		);
		this.detailPanel = new DetailPanel(
			this.skillDetailWrapperEl,
			this.store,
			this.settings,
			this.saveSettings,
			this
		);
		this.dashboardPanel = new DashboardPanel(this.dashboardEl, this.app);
		this.marketplacePanel = new MarketplacePanel(this.marketplaceEl, this, this.settings, () => {
			this.store.refresh(this.settings);
		});
		this.convListPanel = new ConversationListPanel(
			this.convListWrapperEl,
			this.conversationStore,
			(item) => this.onSelectConversation(item)
		);
		this.convDetailPanel = new ConversationDetailPanel(
			this.convDetailWrapperEl,
			this.conversationStore,
			this.app,
			vaultPath
		);

		this.updateRef = this.store.on("updated", () => this.renderAll());
		this.convUpdateRef = this.conversationStore.on("conversations-updated", () => {
			if (this.isConversations) {
				this.convListPanel.render();
				this.sidebarPanel.render();
			}
		});
		this.renderAll();
		this.store.revalidate();
	}

	private hideAllSpecialPanels(): void {
		this.listEl.addClass("as-hidden");
		this.detailEl.addClass("as-hidden");
		this.resizeHandle1.addClass("as-hidden");
		this.resizeHandle2.addClass("as-hidden");
		this.dashboardEl.addClass("as-hidden");
		this.marketplaceEl.addClass("as-hidden");
	}

	private showDefaultPanels(): void {
		this.listEl.removeClass("as-hidden");
		this.detailEl.removeClass("as-hidden");
		this.resizeHandle1.removeClass("as-hidden");
		this.resizeHandle2.removeClass("as-hidden");
	}

	private showSkillPanels(): void {
		this.skillListWrapperEl.removeClass("as-hidden");
		this.skillDetailWrapperEl.removeClass("as-hidden");
		this.convListWrapperEl.addClass("as-hidden");
		this.convDetailWrapperEl.addClass("as-hidden");
	}

	private showConversationPanels(): void {
		this.skillListWrapperEl.addClass("as-hidden");
		this.skillDetailWrapperEl.addClass("as-hidden");
		this.convListWrapperEl.removeClass("as-hidden");
		this.convDetailWrapperEl.removeClass("as-hidden");
	}

	toggleDashboard(): void {
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.isDashboard = !this.isDashboard;
		this.isMarketplace = false;
		this.isConversations = false;
		this.hideAllSpecialPanels();
		if (this.isDashboard) {
			this.dashboardEl.removeClass("as-hidden");
			this.dashboardPanel.render();
		} else {
			this.showDefaultPanels();
			this.showSkillPanels();
		}
		this.sidebarPanel.setDashboardActive(this.isDashboard);
		this.sidebarPanel.setMarketplaceActive(false);
		this.sidebarPanel.setConversationsActive(false);
		this.sidebarPanel.render();
	}

	toggleMarketplace(): void {
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.isMarketplace = !this.isMarketplace;
		this.isDashboard = false;
		this.isConversations = false;
		this.hideAllSpecialPanels();
		if (this.isMarketplace) {
			this.marketplaceEl.removeClass("as-hidden");
			this.marketplacePanel.render();
		} else {
			this.showDefaultPanels();
			this.showSkillPanels();
		}
		this.sidebarPanel.setMarketplaceActive(this.isMarketplace);
		this.sidebarPanel.setDashboardActive(false);
		this.sidebarPanel.setConversationsActive(false);
		this.sidebarPanel.render();
	}

	toggleConversations(): void {
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.isConversations = !this.isConversations;
		this.isDashboard = false;
		this.isMarketplace = false;
		this.hideAllSpecialPanels();
		if (this.isConversations) {
			this.showDefaultPanels();
			this.showConversationPanels();
			this.conversationStore.refresh();
			this.convListPanel.render();
			this.convDetailPanel.clear();
		} else {
			this.showDefaultPanels();
			this.showSkillPanels();
		}
		this.sidebarPanel.setConversationsActive(this.isConversations);
		this.sidebarPanel.setDashboardActive(false);
		this.sidebarPanel.setMarketplaceActive(false);
		this.sidebarPanel.render();
	}

	private renderAll(): void {
		this.sidebarPanel.render();
		if (!this.isDashboard && !this.isMarketplace && !this.isConversations) {
			this.listPanel.render();
			if (!this.store.filteredItems.length) {
				this.detailPanel.clear();
			}
		}
	}

	private openCreateModal(): void {
		new CreateSkillModal(this.app, (filePath: string) => {
			this.store.refresh(this.settings);
			setTimeout(() => {
				const created = this.store.allItems.find((i) => i.filePath === filePath || i.realPath === filePath);
				if (created) this.onSelectItem(created);
			}, 100);
		}).open();
	}

	private onSelectItem(item: SkillItem): void {
		if (this.isDashboard) this.toggleDashboard();
		if (this.isMarketplace) this.toggleMarketplace();
		if (this.isConversations) this.toggleConversations();
		this.listPanel.setSelected(item.id);
		this.listPanel.render();
		this.detailPanel.show(item);
	}

	private onSelectConversation(item: ConversationItem): void {
		this.convListPanel.setSelected(item.uuid);
		this.convListPanel.render();
		this.convDetailPanel.show(item);
	}

	private createResizeHandle(
		container: HTMLElement,
		panel: HTMLElement,
		cssVar: string,
		min: number,
		max: number
	): HTMLElement {
		const handle = container.createDiv("as-resize-handle");
		let startX = 0;
		let startWidth = 0;

		const onMouseMove = (e: MouseEvent) => {
			const newWidth = Math.min(max, Math.max(min, startWidth + (e.clientX - startX)));
			container.style.setProperty(cssVar, `${newWidth}px`);
		};

		const onMouseUp = () => {
			handle.removeClass("is-dragging");
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			this.dragCleanup = null;
		};

		handle.addEventListener("mousedown", (e: MouseEvent) => {
			e.preventDefault();
			startX = e.clientX;
			startWidth = parseInt(container.style.getPropertyValue(cssVar)) || panel.offsetWidth;
			handle.addClass("is-dragging");
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
			this.dragCleanup = onMouseUp;
		});

		return handle;
	}

	onClose(): void {
		this.dragCleanup?.();
		if (this.updateRef) {
			this.store.offref(this.updateRef);
		}
		if (this.convUpdateRef) {
			this.conversationStore.offref(this.convUpdateRef);
		}
	}
}
