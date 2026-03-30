import { MarkdownRenderer, Notice, setIcon, type App } from "obsidian";
import { searchSkills, fetchSkillContent, formatInstalls, getPopularSkills, removeSkill, type MarketplaceSkill } from "../marketplace";
import type { ChopsSettings } from "../types";
import { InstallSkillModal } from "./install-modal";
import { showConfirmModal } from "./confirm-modal";

export class MarketplacePanel {
	private containerEl: HTMLElement;
	private listEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private searchTimer: ReturnType<typeof setTimeout> | null = null;
	private selectedSkill: MarketplaceSkill | null = null;
	private popularCache: MarketplaceSkill[] = [];
	private app: App;
	private settings: ChopsSettings;
	private onRefresh: () => void;

	constructor(containerEl: HTMLElement, view: { app: App }, settings: ChopsSettings, onRefresh: () => void) {
		this.containerEl = containerEl;
		this.app = view.app;
		this.settings = settings;
		this.onRefresh = onRefresh;
	}

	render(): void {
		this.containerEl.empty();
		this.containerEl.addClass("as-marketplace");

		const searchContainer = this.containerEl.createDiv("as-mp-search");
		const input = searchContainer.createEl("input", {
			type: "text",
			placeholder: "Search skills on skills.sh...",
			cls: "as-mp-search-input",
		});
		input.addEventListener("input", () => {
			if (this.searchTimer) clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(() => {
				void this.doSearch(input.value);
			}, 300);
		});

		const body = this.containerEl.createDiv("as-mp-body");
		this.listEl = body.createDiv("as-mp-list");
		this.previewEl = body.createDiv("as-mp-preview");

		this.previewEl.createDiv({ cls: "as-mp-hint", text: "Select a skill to preview." });

		void this.loadPopular();
	}

	private async loadPopular(): Promise<void> {
		if (!this.listEl) return;
		this.listEl.empty();
		this.listEl.createDiv({ cls: "as-mp-loading", text: "Loading popular skills..." });

		const popular = await getPopularSkills();
		this.popularCache = popular;
		this.showPopular();
	}

	private showPopular(): void {
		if (!this.listEl) return;
		this.listEl.empty();

		if (this.popularCache.length === 0) {
			this.listEl.createDiv({ cls: "as-mp-hint", text: "Search for skills to browse and install." });
			return;
		}

		this.listEl.createDiv({ cls: "as-mp-section-title", text: "Popular" });
		for (const skill of this.popularCache) {
			this.renderSkillCard(skill);
		}
	}

	private async doSearch(query: string): Promise<void> {
		if (!this.listEl) return;
		if (query.length < 2) {
			this.showPopular();
			return;
		}

		this.listEl.empty();
		this.listEl.createDiv({ cls: "as-mp-loading", text: "Searching..." });

		const results = await searchSkills(query);
		this.listEl.empty();

		if (results.length === 0) {
			this.listEl.createDiv({ cls: "as-mp-hint", text: "No skills found." });
			return;
		}

		for (const skill of results) {
			this.renderSkillCard(skill);
		}
	}

	private renderSkillCard(skill: MarketplaceSkill): void {
		if (!this.listEl) return;

		const card = this.listEl.createDiv("as-mp-card");
		if (this.selectedSkill?.id === skill.id) card.addClass("is-selected");

		const header = card.createDiv("as-mp-card-header");
		header.createSpan({ cls: "as-mp-card-name", text: skill.name });
		if (skill.installed) {
			header.createSpan({ cls: "as-mp-installed-badge", text: "Installed" });
		}

		card.createDiv({ cls: "as-mp-card-source", text: skill.source });

		const meta = card.createDiv("as-mp-card-meta");
		const dlIcon = meta.createSpan("as-mp-dl-icon");
		setIcon(dlIcon, "download");
		meta.createSpan({ cls: "as-mp-card-installs", text: formatInstalls(skill.installs) });

		card.addEventListener("click", () => {
			this.selectedSkill = skill;
			if (this.listEl) {
				this.listEl.querySelectorAll(".as-mp-card").forEach((c) => c.removeClass("is-selected"));
			}
			card.addClass("is-selected");
			void this.showPreview(skill);
		});
	}

	private async showPreview(skill: MarketplaceSkill): Promise<void> {
		if (!this.previewEl) return;
		this.previewEl.empty();

		const header = this.previewEl.createDiv("as-mp-preview-header");

		const topRow = header.createDiv("as-mp-preview-top");
		const left = topRow.createDiv("as-mp-preview-left");
		left.createDiv({ cls: "as-mp-preview-name", text: skill.name });
		const meta = left.createDiv("as-mp-preview-meta");
		meta.createSpan({ cls: "as-mp-preview-source", text: skill.source });
		const dlIcon = meta.createSpan("as-mp-dl-icon");
		setIcon(dlIcon, "download");
		meta.createSpan({ cls: "as-mp-preview-installs", text: formatInstalls(skill.installs) });

		const right = topRow.createDiv("as-mp-preview-right");

		if (!skill.installed) {
			this.renderInstallButton(right, skill);
		} else {
			right.createSpan({ cls: "as-mp-installed-label", text: "Installed" });
			const uninstallBtn = right.createEl("button", { cls: "as-mp-uninstall-btn", text: "Uninstall" });
			uninstallBtn.addEventListener("click", () => {
				showConfirmModal(this.app, "Uninstall skill", `Remove "${skill.name}" from all agents?`, () => {
					uninstallBtn.setText("Removing...");
					uninstallBtn.disabled = true;
					setTimeout(() => {
						const result = removeSkill(skill.name, this.settings.packageRunner);
						if (result.success) {
							new Notice(`Removed ${skill.name}`, 5000);
							skill.installed = false;
							this.onRefresh();
							void this.showPreview(skill);
						} else {
							new Notice(`Failed: ${result.output.slice(0, 200)}`, 5000);
							uninstallBtn.setText("Uninstall");
							uninstallBtn.disabled = false;
						}
					}, 10);
				});
			});
		}

		const contentEl = this.previewEl.createDiv("as-mp-preview-content");
		contentEl.createDiv({ cls: "as-mp-loading", text: "Loading skill content..." });

		const content = await fetchSkillContent(skill.source, skill.name, skill.id);
		contentEl.empty();

		if (content) {
			skill.content = content;
			const rendered = contentEl.createDiv("as-mp-rendered markdown-rendered");
			void MarkdownRenderer.render(
				this.app,
				content,
				rendered,
				"",
				null as unknown as import("obsidian").Component
			);
		} else {
			contentEl.createDiv({ cls: "as-mp-hint", text: "Could not load skill content." });
		}
	}

	private renderInstallButton(container: HTMLElement, skill: MarketplaceSkill): void {
		const row = container.createDiv("as-mp-install-row");
		const btn = row.createEl("button", { cls: "as-mp-install-btn", text: "Install" });

		btn.addEventListener("click", () => {
			new InstallSkillModal(this.app, skill, this.settings, () => {
				this.onRefresh();
				void this.showPreview(skill);
			}).open();
		});
	}
}
