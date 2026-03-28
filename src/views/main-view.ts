import { ItemView, type WorkspaceLeaf } from "obsidian";
import type { SkillStore } from "../store";
import type { SkillItem, ChopsSettings } from "../types";
import { SidebarPanel } from "./sidebar";
import { ListPanel } from "./list";
import { DetailPanel } from "./detail";

export const VIEW_TYPE = "agentfiles-view";

export class AgentfilesView extends ItemView {
	private store: SkillStore;
	private settings: ChopsSettings;
	private saveSettings: () => Promise<void>;

	private sidebarPanel!: SidebarPanel;
	private listPanel!: ListPanel;
	private detailPanel!: DetailPanel;

	private sidebarEl!: HTMLElement;
	private listEl!: HTMLElement;
	private detailEl!: HTMLElement;

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

	async onOpen(): Promise<void> {
		const container = this.contentEl;
		container.empty();
		container.addClass("as-container");

		this.sidebarEl = container.createDiv("as-panel as-panel-sidebar");
		this.listEl = container.createDiv("as-panel as-panel-list");
		this.detailEl = container.createDiv("as-panel as-panel-detail");

		this.sidebarPanel = new SidebarPanel(this.sidebarEl, this.store);
		this.listPanel = new ListPanel(this.listEl, this.store, (item) =>
			this.onSelectItem(item)
		);
		this.detailPanel = new DetailPanel(
			this.detailEl,
			this.store,
			this.settings,
			this.saveSettings,
			this
		);

		this.store.on("updated", () => this.renderAll());
		this.renderAll();
	}

	private renderAll(): void {
		this.sidebarPanel.render();
		this.listPanel.render();
		if (!this.store.filteredItems.length) {
			this.detailPanel.clear();
		}
	}

	private onSelectItem(item: SkillItem): void {
		this.listPanel.setSelected(item.id);
		this.listPanel.render();
		this.detailPanel.show(item);
	}

	async onClose(): Promise<void> {
		this.store.offref(this.store.on("updated", () => {}));
	}
}
