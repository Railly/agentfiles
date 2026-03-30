import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { SkillStore } from "../store";
import type { SkillItem, ChopsSettings } from "../types";
import { SidebarPanel } from "./sidebar";
import { ListPanel } from "./list";
import { DetailPanel } from "./detail";
import { DashboardPanel } from "./dashboard";
import { MarketplacePanel } from "./marketplace-view";

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

	private sidebarEl!: HTMLElement;
	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;
	private dashboardEl!: HTMLElement;
	private marketplaceEl!: HTMLElement;
	private resizeHandle1!: HTMLElement;
	private resizeHandle2!: HTMLElement;

	private isDashboard = false;
	private isMarketplace = false;
	private updateRef: ReturnType<typeof this.store.on> | null = null;
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

		this.sidebarPanel = new SidebarPanel(
			this.sidebarEl,
			this.store,
			() => this.toggleDashboard(),
			() => this.toggleMarketplace()
		);
		this.listPanel = new ListPanel(this.listEl, this.store, (item: SkillItem) =>
			this.onSelectItem(item)
		);
		this.detailPanel = new DetailPanel(
			this.detailEl,
			this.store,
			this.settings,
			this.saveSettings,
			this
		);
		this.dashboardPanel = new DashboardPanel(this.dashboardEl, this.app);
		this.marketplacePanel = new MarketplacePanel(this.marketplaceEl, this, this.settings, () => {
			this.store.refresh(this.settings);
		});

		this.updateRef = this.store.on("updated", () => this.renderAll());
		this.renderAll();
	}

	toggleDashboard(): void {
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.isDashboard = !this.isDashboard;
		if (this.isMarketplace) {
			this.isMarketplace = false;
			this.marketplaceEl.addClass("as-hidden");
		}
		if (this.isDashboard) {
			this.listEl.addClass("as-hidden");
			this.detailEl.addClass("as-hidden");
			this.resizeHandle1.addClass("as-hidden");
			this.resizeHandle2.addClass("as-hidden");
			this.dashboardEl.removeClass("as-hidden");
			this.dashboardPanel.render();
		} else {
			this.listEl.removeClass("as-hidden");
			this.detailEl.removeClass("as-hidden");
			this.resizeHandle1.removeClass("as-hidden");
			this.resizeHandle2.removeClass("as-hidden");
			this.dashboardEl.addClass("as-hidden");
		}
		this.sidebarPanel.setDashboardActive(this.isDashboard);
		this.sidebarPanel.render();
	}

	toggleMarketplace(): void {
		this.dragCleanup?.();
		this.dragCleanup = null;
		this.isMarketplace = !this.isMarketplace;
		if (this.isDashboard) {
			this.isDashboard = false;
			this.dashboardEl.addClass("as-hidden");
		}
		if (this.isMarketplace) {
			this.listEl.addClass("as-hidden");
			this.detailEl.addClass("as-hidden");
			this.resizeHandle1.addClass("as-hidden");
			this.resizeHandle2.addClass("as-hidden");
			this.marketplaceEl.removeClass("as-hidden");
			this.marketplacePanel.render();
		} else {
			this.listEl.removeClass("as-hidden");
			this.detailEl.removeClass("as-hidden");
			this.resizeHandle1.removeClass("as-hidden");
			this.resizeHandle2.removeClass("as-hidden");
			this.marketplaceEl.addClass("as-hidden");
		}
		this.sidebarPanel.setMarketplaceActive(this.isMarketplace);
		this.sidebarPanel.render();
	}

	private renderAll(): void {
		this.sidebarPanel.render();
		if (!this.isDashboard && !this.isMarketplace) {
			this.listPanel.render();
			if (!this.store.filteredItems.length) {
				this.detailPanel.clear();
			}
		}
	}

	private onSelectItem(item: SkillItem): void {
		if (this.isDashboard) this.toggleDashboard();
		if (this.isMarketplace) this.toggleMarketplace();
		this.listPanel.setSelected(item.id);
		this.listPanel.render();
		this.detailPanel.show(item);
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
	}
}
