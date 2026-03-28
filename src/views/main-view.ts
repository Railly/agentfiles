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
	private resizeHandle1!: HTMLElement;
	private resizeHandle2!: HTMLElement;

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
		this.resizeHandle1 = this.createResizeHandle(container, this.sidebarEl, "--as-sidebar-width", 120, 400);
		this.listEl = container.createDiv("as-panel as-panel-list");
		this.resizeHandle2 = this.createResizeHandle(container, this.listEl, "--as-list-width", 180, 600);
		this.detailEl = container.createDiv("as-panel as-panel-detail");
		this.dashboardEl = container.createDiv("as-panel as-panel-dashboard");
		this.dashboardEl.style.display = "none";

		this.sidebarPanel = new SidebarPanel(this.sidebarEl, this.store, this.settings, () =>
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
		};

		handle.addEventListener("mousedown", (e: MouseEvent) => {
			e.preventDefault();
			startX = e.clientX;
			startWidth = panel.offsetWidth;
			handle.addClass("is-dragging");
			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		});

		return handle;
	}

	toggleDashboard(): void {
		this.isDashboard = !this.isDashboard;
		if (this.isDashboard) {
			this.resizeHandle1.style.display = "none";
			this.listEl.style.display = "none";
			this.resizeHandle2.style.display = "none";
			this.detailEl.style.display = "none";
			this.dashboardEl.style.display = "block";
			this.dashboardPanel.render();
		} else {
			this.resizeHandle1.style.display = "";
			this.listEl.style.display = "";
			this.resizeHandle2.style.display = "";
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
