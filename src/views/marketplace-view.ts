import { Component, MarkdownRenderer, Notice, setIcon, type App } from "obsidian";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { searchSkills, fetchSkillContent, formatInstalls, getPopularSkills, removeSkillAsync, refreshInstalledStatus, type MarketplaceSkill } from "../marketplace";
import type { ChopsSettings } from "../types";
import { InstallSkillModal } from "./install-modal";
import { showConfirmModal } from "./confirm-modal";

const POPULAR_CACHE_FILE = join(homedir(), ".skillkit", "marketplace-popular.json");

let cachedPopular: MarketplaceSkill[] | null = null;
let cachedSearchQuery = "";
let cachedSearchResults: MarketplaceSkill[] | null = null;
const renderComponent = new Component();

function loadPopularFromDisk(): void {
	if (cachedPopular) return;
	if (!existsSync(POPULAR_CACHE_FILE)) return;
	try {
		const skills = JSON.parse(readFileSync(POPULAR_CACHE_FILE, "utf-8")) as MarketplaceSkill[];
		cachedPopular = refreshInstalledStatus(skills);
	} catch { /* empty */ }
}

function savePopularToDisk(): void {
	if (!cachedPopular) return;
	try {
		writeFileSync(POPULAR_CACHE_FILE, JSON.stringify(cachedPopular), "utf-8");
	} catch { /* empty */ }
}

loadPopularFromDisk();

export class MarketplacePanel {
	private containerEl: HTMLElement;
	private inputEl: HTMLInputElement | null = null;
	private listEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private searchTimer: ReturnType<typeof setTimeout> | null = null;
	private selectedSkill: MarketplaceSkill | null = null;
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
		if (!this.inputEl) {
			this.containerEl.empty();
			this.containerEl.addClass("as-marketplace");

			const searchContainer = this.containerEl.createDiv("as-mp-search");
			this.inputEl = searchContainer.createEl("input", {
				type: "text",
				placeholder: "Search skills on skills.sh...",
				cls: "as-mp-search-input",
			});
			this.inputEl.addEventListener("input", () => {
				if (this.searchTimer) clearTimeout(this.searchTimer);
				this.searchTimer = setTimeout(() => {
					void this.doSearch(this.inputEl!.value);
				}, 300);
			});

			const body = this.containerEl.createDiv("as-mp-body");
			this.listEl = body.createDiv("as-mp-list");
			this.previewEl = body.createDiv("as-mp-preview");
			this.previewEl.createDiv({ cls: "as-mp-hint", text: "Select a skill to preview." });
		}

		this.inputEl.value = cachedSearchQuery;

		if (cachedSearchQuery.length >= 2 && cachedSearchResults) {
			this.showResults(cachedSearchResults);
		} else if (cachedPopular) {
			this.showPopular();
		} else {
			void this.loadPopular();
		}
	}

	private async loadPopular(): Promise<void> {
		if (!this.listEl) return;
		this.listEl.empty();
		this.listEl.createDiv({ cls: "as-mp-loading", text: "Loading popular skills..." });

		const popular = await getPopularSkills();
		cachedPopular = popular;
		savePopularToDisk();
		this.showPopular();
	}

	private refreshList(): void {
		if (cachedPopular) {
			refreshInstalledStatus(cachedPopular);
		}
		if (cachedSearchResults) {
			refreshInstalledStatus(cachedSearchResults);
		}
		if (cachedSearchQuery.length >= 2 && cachedSearchResults) {
			this.showResults(cachedSearchResults);
		} else {
			this.showPopular();
		}
	}

	private showPopular(): void {
		if (!this.listEl) return;
		this.listEl.empty();

		if (!cachedPopular || cachedPopular.length === 0) {
			this.listEl.createDiv({ cls: "as-mp-hint", text: "Search for skills to browse and install." });
			return;
		}

		this.listEl.createDiv({ cls: "as-mp-section-title", text: "Popular" });
		for (const skill of cachedPopular) {
			this.renderSkillCard(skill);
		}
	}

	private showResults(results: MarketplaceSkill[]): void {
		if (!this.listEl) return;
		this.listEl.empty();

		if (results.length === 0) {
			this.listEl.createDiv({ cls: "as-mp-hint", text: "No skills found." });
			return;
		}

		for (const skill of results) {
			this.renderSkillCard(skill);
		}
	}

	private async doSearch(query: string): Promise<void> {
		if (!this.listEl) return;
		cachedSearchQuery = query;

		if (query.length < 2) {
			cachedSearchResults = null;
			this.showPopular();
			return;
		}

		this.listEl.empty();
		this.listEl.createDiv({ cls: "as-mp-loading", text: "Searching..." });

		const results = await searchSkills(query);
		cachedSearchResults = results;
		this.showResults(results);
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
					new Notice(`Removing ${skill.name}...`, 3000);
					void removeSkillAsync(skill.name, this.settings.packageRunner).then((result) => {
						if (result.success) {
							new Notice(`Removed ${skill.name}`, 5000);
							skill.installed = false;
							this.refreshList();
							void this.showPreview(skill);
						} else {
							new Notice(`Failed to remove ${skill.name}`, 5000);
							uninstallBtn.setText("Uninstall");
							uninstallBtn.disabled = false;
						}
					});
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
				renderComponent
			);
		} else {
			contentEl.createDiv({ cls: "as-mp-hint", text: "Could not load skill content." });
		}
	}

	private renderInstallButton(container: HTMLElement, skill: MarketplaceSkill): void {
		const btn = container.createEl("button", { cls: "as-mp-install-btn", text: "Install" });

		btn.addEventListener("click", () => {
			new InstallSkillModal(this.app, skill, this.settings, () => {
				this.refreshList();
				void this.showPreview(skill);
			}).open();
		});
	}
}
