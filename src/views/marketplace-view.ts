import { MarkdownRenderer, Notice, setIcon } from "obsidian";
import { searchSkills, fetchSkillContent, installSkill, formatInstalls, getPopularSkills, type MarketplaceSkill } from "../marketplace";
import { TOOL_CONFIGS } from "../tool-configs";
import { getInstalledTools } from "../scanner";

export class MarketplacePanel {
	private containerEl: HTMLElement;
	private listEl: HTMLElement | null = null;
	private previewEl: HTMLElement | null = null;
	private searchTimer: ReturnType<typeof setTimeout> | null = null;
	private selectedSkill: MarketplaceSkill | null = null;
	private popularCache: MarketplaceSkill[] = [];
	private app: { app: { workspace: unknown } };

	constructor(containerEl: HTMLElement, app: { app: { workspace: unknown } }) {
		this.containerEl = containerEl;
		this.app = app;
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
		header.createDiv({ cls: "as-mp-preview-name", text: skill.name });
		header.createDiv({ cls: "as-mp-preview-source", text: skill.source });

		const stats = header.createDiv("as-mp-preview-stats");
		const dlIcon = stats.createSpan("as-mp-dl-icon");
		setIcon(dlIcon, "download");
		stats.createSpan({ text: `${formatInstalls(skill.installs)} installs` });

		if (!skill.installed) {
			this.renderInstallButton(header, skill);
		} else {
			header.createDiv({ cls: "as-mp-installed-label", text: "Already installed" });
		}

		const contentEl = this.previewEl.createDiv("as-mp-preview-content");
		contentEl.createDiv({ cls: "as-mp-loading", text: "Loading skill content..." });

		const content = await fetchSkillContent(skill.source, skill.name, skill.id);
		contentEl.empty();

		if (content) {
			skill.content = content;
			const rendered = contentEl.createDiv("as-mp-rendered markdown-rendered");
			void MarkdownRenderer.render(
				(this.app as unknown as { app: unknown }).app as import("obsidian").App,
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

		const installedTools = getInstalledTools();
		const agentOptions = TOOL_CONFIGS
			.filter((t) => t.isInstalled() && installedTools.includes(t.id))
			.slice(0, 5);

		const btn = row.createEl("button", { cls: "as-mp-install-btn", text: "Install" });

		btn.addEventListener("click", () => {
			btn.setText("Installing...");
			btn.disabled = true;

			const agents = agentOptions.map((a) => a.id.replace("-", " "));
			setTimeout(() => {
				const result = installSkill(skill.source, agents);
				if (result.success) {
					new Notice(`Installed ${skill.name}`);
					skill.installed = true;
					void this.showPreview(skill);
				} else {
					new Notice(`Failed to install: ${result.output}`);
					btn.setText("Install");
					btn.disabled = false;
				}
			}, 10);
		});
	}
}
