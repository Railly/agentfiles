import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { SkillStore } from "../store";
import type { SkillItem, ChopsSettings } from "../types";
import { SidebarPanel } from "./sidebar";
import { ListPanel } from "./list";
import { DetailPanel } from "./detail";
import { DashboardPanel } from "./dashboard";

export const VIEW_TYPE = "agentfiles-view";

export class AgentfilesView extends ItemView {
	private store: SkillStore;
	private settings: ChopsSettings;
	private saveSettings: () => Promise<void>;

	private sidebarPanel!: SidebarPanel;
	private listPanel!: ListPanel;
	private detailPanel!: DetailPanel;
	private dashboardPanel!: DashboardPanel;

	private sidebarEl!: HTMLElement;
	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;
	private dashboardEl!: HTMLElement;

	private isDashboard = false;
	private updateRef: ReturnType<typeof this.store.on> | null = null;

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
		this.listEl = container.createDiv("as-panel as-panel-list");
		this.detailEl = container.createDiv("as-panel as-panel-detail");
		this.dashboardEl = container.createDiv("as-panel as-panel-dashboard");
		this.dashboardEl.style.display = "none";

		this.sidebarPanel = new SidebarPanel(this.sidebarEl, this.store, () =>
			this.toggleDashboard()
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
		this.dashboardPanel = new DashboardPanel(this.dashboardEl);

		this.updateRef = this.store.on("updated", () => this.renderAll());
		this.renderAll();
	}

	toggleDashboard(): void {
		this.isDashboard = !this.isDashboard;
		if (this.isDashboard) {
			this.listEl.style.display = "none";
			this.detailEl.style.display = "none";
			this.dashboardEl.style.display = "block";
			this.dashboardPanel.render();
		} else {
			this.listEl.style.display = "";
			this.detailEl.style.display = "";
			this.dashboardEl.style.display = "none";
		}
		this.sidebarPanel.setDashboardActive(this.isDashboard);
		this.sidebarPanel.render();
	}

	private renderAll(): void {
		this.sidebarPanel.render();
		if (!this.isDashboard) {
			this.listPanel.render();
			if (!this.store.filteredItems.length) {
				this.detailPanel.clear();
			}
		}
	}

	private onSelectItem(item: SkillItem): void {
		if (this.isDashboard) {
			this.toggleDashboard();
		}
		this.listPanel.setSelected(item.id);
		this.listPanel.render();
		this.detailPanel.show(item);
	}

	onClose(): void {
		if (this.updateRef) {
			this.store.offref(this.updateRef);
		}
	}
}
