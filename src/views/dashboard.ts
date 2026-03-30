import { Notice, setIcon } from "obsidian";
import { shell } from "electron";
import { isSkillkitAvailable, runSkillkitJson, runSkillkitAction } from "../skillkit";

interface StatsJson {
	period: { days: number };
	total_invocations: number;
	unique_skills: number;
	most_active_day: string;
	top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
}

interface HealthJson {
	installed: number;
	agents: string[];
	db: { exists: boolean; events: number };
	usage: { used_30d: number; unused_30d: number; never_used: string[] };
	metadata: { total_chars: number; budget: number; pct: number };
	content: { total_chars: number };
	warnings: { oversized: { name: string; lines: number }[]; long_descriptions: { name: string; chars: number }[] };
}

interface BurnAgent {
	agent: string;
	cost: { total: number };
	period: { days: number; sessions: number; api_calls: number };
	by_day: { date: string; costUsd: number }[];
	by_model: { model: string; apiCalls: number; costUsd: number }[];
}

interface ContextJson {
	always_loaded: { total_tokens: number; claude_md_tokens: number; skill_metadata_tokens: number; memory_tokens: number };
	cost_per_call: { first_call_cache_write: number; subsequent_cache_read: number };
	session_estimate: { with_cache: number; without_cache: number; savings_pct: number };
	sources: { name: string; tokens: number }[];
}

interface DashboardData {
	stats: StatsJson | null;
	health: HealthJson | null;
	burn: BurnAgent | null;
	context: ContextJson | null;
}

function loadData(): DashboardData {
	const stats = runSkillkitJson("stats") as StatsJson | null;
	const health = runSkillkitJson("health") as HealthJson | null;
	const burnArr = runSkillkitJson("burn") as BurnAgent[] | null;
	const context = runSkillkitJson("context") as ContextJson | null;

	return {
		stats,
		health,
		burn: burnArr && burnArr.length > 0 ? burnArr[0] : null,
		context,
	};
}

export class DashboardPanel {
	private containerEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
	}

	render(): void {
		this.containerEl.empty();
		this.containerEl.addClass("as-dashboard");

		if (!isSkillkitAvailable()) {
			this.renderNoSkillkit();
			return;
		}

		const loading = this.containerEl.createDiv("as-dash-loading");
		loading.createDiv("as-dash-spinner");
		loading.createDiv({ cls: "as-dash-loading-text", text: "Loading analytics..." });

		setTimeout(() => {
			const data = loadData();
			loading.remove();

			if (data.stats) this.renderOverview(data.stats, data.health);
			if (data.stats) this.renderTopSkills(data.stats);
			if (data.health || data.context) {
				const row = this.containerEl.createDiv("as-dash-row");
				if (data.health) this.renderHealth(data.health, row);
				if (data.context) this.renderContext(data.context, row);
			}
			if (data.burn) this.renderBurn(data.burn);
			if (data.health) this.renderStale(data.health);
		}, 10);
	}

	private renderNoSkillkit(): void {
		const empty = this.containerEl.createDiv("as-dash-empty");
		const iconEl = empty.createDiv("as-dash-empty-icon");
		setIcon(iconEl, "bar-chart-2");
		empty.createEl("h3", { text: "Dashboard requires skillkit" });
		empty.createEl("p", { text: "Install skillkit to unlock usage analytics, burn rate, context tax, and more." });
		const cmd = empty.createDiv("as-dash-install-cmd");
		cmd.createEl("code", { text: "npm i -g @crafter/skillkit && skillkit scan" });
		const link = empty.createEl("a", {
			cls: "as-skillkit-link",
			text: "Learn more",
			href: "https://www.npmjs.com/package/@crafter/skillkit",
		});
		link.addEventListener("click", (e) => {
			e.preventDefault();
			void shell.openExternal("https://www.npmjs.com/package/@crafter/skillkit");
		});
	}

	private renderOverview(stats: StatsJson, health: HealthJson | null): void {
		const section = this.containerEl.createDiv("as-dash-section");
		const titleRow = section.createDiv("as-dash-title-row");
		titleRow.createDiv({ cls: "as-dash-title", text: "Overview" });
		const scanBtn = titleRow.createEl("button", { cls: "as-action-btn", text: "Scan sessions" });
		scanBtn.addEventListener("click", () => {
			scanBtn.setText("Scanning...");
			scanBtn.disabled = true;
			setTimeout(() => {
				const result = runSkillkitAction("scan");
				if (result.success) {
					new Notice("Scan complete");
					this.render();
				} else {
					new Notice(`Scan failed: ${result.output}`);
				}
				scanBtn.setText("Scan sessions");
				scanBtn.disabled = false;
			}, 10);
		});

		const grid = section.createDiv("as-dash-stats");
		this.statCard(grid, String(stats.total_invocations), "invocations", "activity");
		this.statCard(grid, String(stats.unique_skills), "active skills", "sparkles");
		this.statCard(grid, String(health?.installed ?? 0), "installed", "package");
		this.statCard(grid, String(health?.usage.unused_30d ?? 0), "stale", "alert-triangle");
	}

	private statCard(container: HTMLElement, value: string, label: string, icon: string): void {
		const card = container.createDiv("as-stat-card");
		const iconEl = card.createDiv("as-stat-icon");
		setIcon(iconEl, icon);
		card.createDiv({ cls: "as-stat-value", text: value });
		card.createDiv({ cls: "as-stat-label", text: label });
	}

	private renderTopSkills(stats: StatsJson): void {
		if (stats.top_skills.length === 0) return;
		const section = this.containerEl.createDiv("as-dash-section");
		section.createDiv({ cls: "as-dash-title", text: `Top Skills (${stats.period.days}d)` });

		const maxUses = stats.top_skills[0]?.total || 1;
		const list = section.createDiv("as-dash-bars");

		for (const skill of stats.top_skills.slice(0, 10)) {
			const row = list.createDiv("as-bar-row");
			row.createSpan({ cls: "as-bar-name", text: skill.name });
			const barWrap = row.createDiv("as-bar-wrap");
			const bar = barWrap.createDiv("as-bar-fill");
			bar.setCssProps({ "--bar-w": `${(skill.total / maxUses) * 100}%` });
			row.createSpan({ cls: "as-bar-count", text: String(skill.total) });
		}
	}

	private renderHealth(health: HealthJson, parent?: HTMLElement): void {
		const section = (parent || this.containerEl).createDiv("as-dash-section");
		section.createDiv({ cls: "as-dash-title", text: "Health" });

		const total = health.usage.used_30d + health.usage.unused_30d;
		const usedPct = total > 0 ? Math.round((health.usage.used_30d / total) * 100) : 0;

		const row = section.createDiv("as-dash-health-row");

		const donut = row.createDiv("as-donut");
		donut.setCssProps({ "--pct": `${usedPct}` });
		donut.createDiv({ cls: "as-donut-label", text: `${usedPct}%` });
		donut.createDiv({ cls: "as-donut-sub", text: "active" });

		const details = row.createDiv("as-health-details");
		details.createDiv({ cls: "as-health-line", text: `${health.usage.used_30d} used in 30d` });
		details.createDiv({ cls: "as-health-line as-health-warn", text: `${health.usage.unused_30d} never triggered` });

		const budgetBar = details.createDiv("as-budget-bar");
		const fill = budgetBar.createDiv("as-budget-fill");
		fill.setCssProps({ "--bar-w": `${health.metadata.pct}%` });
		if (health.metadata.pct > 80) fill.addClass("as-budget-over");
		details.createDiv({ cls: "as-health-line", text: `Metadata budget: ${health.metadata.pct}%` });
	}

	private renderBurn(burn: BurnAgent): void {
		const section = this.containerEl.createDiv("as-dash-section");
		section.createDiv({ cls: "as-dash-title", text: `Burn Rate — ${burn.agent} (${burn.period.days}d)` });

		const stats = section.createDiv("as-dash-stats as-dash-stats-sm");
		this.statCard(stats, `$${Math.round(burn.cost.total).toLocaleString()}`, "total cost", "flame");
		this.statCard(stats, `$${Math.round(burn.cost.total / (burn.period.days || 1)).toLocaleString()}`, "daily avg", "trending-up");
		this.statCard(stats, `${(burn.period.sessions || 0).toLocaleString()}`, "sessions", "terminal");
		this.statCard(stats, `${((burn.period.api_calls || 0) / 1000).toFixed(0)}k`, "API calls", "zap");

		if (burn.by_model && burn.by_model.length > 0) {
			const models = section.createDiv("as-model-breakdown");
			for (const m of burn.by_model.slice(0, 4)) {
				const row = models.createDiv("as-model-row");
				row.createSpan({ cls: "as-model-name", text: m.model });
				row.createSpan({ cls: "as-model-calls", text: `${m.apiCalls.toLocaleString()} calls` });
				if (m.costUsd > 0) {
					row.createSpan({ cls: "as-model-cost", text: `$${Math.round(m.costUsd).toLocaleString()}` });
				}
			}
		}

		const last14 = burn.by_day.slice(-14);
		if (last14.length === 0) return;

		const maxCost = Math.max(...last14.map((d) => d.costUsd), 1);
		const chart = section.createDiv("as-burn-chart");

		for (const day of last14) {
			const col = chart.createDiv("as-burn-col");
			const bar = col.createDiv("as-burn-bar");
			const height = Math.max(2, (day.costUsd / maxCost) * 100);
			bar.setCssProps({ "--bar-h": `${height}%` });
			bar.title = `${day.date}: $${day.costUsd.toFixed(0)}`;
			col.createDiv({ cls: "as-burn-date", text: day.date.slice(8) });
		}
	}

	private renderContext(ctx: ContextJson, parent?: HTMLElement): void {
		const section = (parent || this.containerEl).createDiv("as-dash-section");
		section.createDiv({ cls: "as-dash-title", text: "Context Tax" });

		const total = ctx.always_loaded.total_tokens;
		const segments = [
			{ label: "CLAUDE.md", tokens: ctx.always_loaded.claude_md_tokens, cls: "as-ctx-claude" },
			{ label: "Skills metadata", tokens: ctx.always_loaded.skill_metadata_tokens, cls: "as-ctx-skills" },
			{ label: "Memory", tokens: ctx.always_loaded.memory_tokens, cls: "as-ctx-memory" },
		];

		const bar = section.createDiv("as-ctx-bar");
		for (const seg of segments) {
			const part = bar.createDiv(`as-ctx-part ${seg.cls}`);
			part.setCssProps({ "--bar-w": `${(seg.tokens / total) * 100}%` });
			part.title = `${seg.label}: ${(seg.tokens / 1000).toFixed(1)}k tokens`;
		}

		const legend = section.createDiv("as-ctx-legend");
		for (const seg of segments) {
			const item = legend.createDiv("as-ctx-legend-item");
			item.createSpan({ cls: `as-ctx-dot ${seg.cls}` });
			item.createSpan({ text: `${seg.label}: ${(seg.tokens / 1000).toFixed(1)}k` });
		}

		const costs = section.createDiv("as-ctx-costs");
		costs.createDiv({ text: `Per session (cached): $${ctx.session_estimate.with_cache.toFixed(2)}` });
		costs.createDiv({ text: `Without cache: $${ctx.session_estimate.without_cache.toFixed(2)}` });
		costs.createDiv({ cls: "as-ctx-savings", text: `Cache saves ${ctx.session_estimate.savings_pct.toFixed(0)}%` });
	}

	private renderStale(health: HealthJson): void {
		if (health.usage.never_used.length === 0) return;
		const section = this.containerEl.createDiv("as-dash-section");

		const titleRow = section.createDiv("as-dash-title-row");
		titleRow.createDiv({ cls: "as-dash-title", text: `Stale skills (${health.usage.unused_30d})` });

		const pruneBtn = titleRow.createEl("button", { cls: "as-action-btn as-action-btn-danger", text: "Prune all" });
		pruneBtn.addEventListener("click", () => {
			const confirmed = confirm(`Remove ${health.usage.unused_30d} unused skills? This cannot be undone.`);
			if (!confirmed) return;
			pruneBtn.setText("Pruning...");
			pruneBtn.disabled = true;
			setTimeout(() => {
				const result = runSkillkitAction("prune --yes");
				if (result.success) {
					new Notice(`Pruned stale skills`);
					this.render();
				} else {
					new Notice(`Prune failed: ${result.output}`);
				}
				pruneBtn.setText("Prune all");
				pruneBtn.disabled = false;
			}, 10);
		});

		const list = section.createDiv("as-stale-list");
		for (const name of health.usage.never_used.slice(0, 20)) {
			const item = list.createDiv("as-stale-item");
			item.createSpan({ text: name });
		}

		if (health.usage.never_used.length > 20) {
			list.createDiv({
				cls: "as-stale-more",
				text: `+${health.usage.never_used.length - 20} more`,
			});
		}
	}
}
