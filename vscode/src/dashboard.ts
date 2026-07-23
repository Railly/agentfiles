import * as vscode from "vscode";
import { isSkillkitAvailable, runSkillkitJsonAsync } from "../../src/skillkit";

interface StatsJson {
	period: { days: number };
	total_invocations: number;
	unique_skills: number;
	most_active_day: string;
	streak?: { current: number; longest: number };
	velocity?: { this_week: number; last_week: number; change_pct: number };
	top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
}

interface HealthJson {
	installed: number;
	agents: string[];
	db: { exists: boolean; events: number };
	usage: { used_30d: number; unused_30d: number; never_used: string[] };
	metadata: { total_chars: number; budget: number; pct: number };
}

interface BurnAgent {
	agent: string;
	cost: { total: number };
	period: { days: number; sessions: number; api_calls: number };
	by_day: { date: string; costUsd: number }[];
	by_model: { model: string; apiCalls: number; costUsd: number }[];
}

interface ContextJson {
	always_loaded: { total_tokens: number };
	session_estimate: { with_cache: number; without_cache: number; savings_pct: number };
	sources: { name: string; tokens: number }[];
}

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sparkline(values: number[]): string {
	if (values.length === 0) return "";
	const max = Math.max(...values, 1);
	const w = 120;
	const h = 24;
	const step = values.length > 1 ? w / (values.length - 1) : w;
	const points = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(" ");
	return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${points}" fill="none" stroke="var(--vscode-charts-blue)" stroke-width="1.5"/></svg>`;
}

function tile(label: string, value: string, extra = ""): string {
	return `<div class="tile"><div class="tile-value">${value}</div><div class="tile-label">${esc(label)}</div>${extra}</div>`;
}

function notInstalledHtml(): string {
	return `<!DOCTYPE html><html><body style="font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 24px; text-align: center;">
	<h3>Dashboard requires skillkit</h3>
	<p>Install skillkit to unlock usage analytics, burn rate, and context tax.</p>
	<code>npm i -g @crafter/skillkit &amp;&amp; skillkit scan</code>
	</body></html>`;
}

function dashboardHtml(stats: StatsJson | null, health: HealthJson | null, burn: BurnAgent | null, context: ContextJson | null): string {
	const sections: string[] = [];

	if (stats) {
		const velocity = stats.velocity
			? tile("vs last week", `${stats.velocity.change_pct >= 0 ? "+" : ""}${stats.velocity.change_pct}%`)
			: "";
		sections.push(`<section><h2>Overview (${stats.period.days}d)</h2><div class="tiles">
			${tile("invocations", String(stats.total_invocations))}
			${tile("unique skills", String(stats.unique_skills))}
			${stats.streak ? tile("streak", `${stats.streak.current}d`) : ""}
			${velocity}
		</div></section>`);
		if (stats.top_skills.length) {
			const rows = stats.top_skills
				.slice(0, 10)
				.map(
					(s) =>
						`<tr><td>${esc(s.name)}</td><td class="num">${s.total}</td><td>${sparkline(s.daily.map((d) => d.count))}</td></tr>`,
				)
				.join("");
			sections.push(`<section><h2>Top skills</h2><table>${rows}</table></section>`);
		}
	}

	if (health) {
		sections.push(`<section><h2>Health</h2><div class="tiles">
			${tile("installed", String(health.installed))}
			${tile("agents", String(health.agents.length))}
			${tile("used 30d", String(health.usage.used_30d))}
			${tile("unused 30d", String(health.usage.unused_30d))}
			${tile("metadata budget", `${health.metadata.pct}%`)}
		</div>
		${health.agents.length ? `<div class="agents">${health.agents.map((a) => `<span class="chip">${esc(a)}</span>`).join("")}</div>` : ""}
		</section>`);
	}

	if (burn) {
		const models = burn.by_model
			.slice(0, 6)
			.map((m) => `<tr><td>${esc(m.model)}</td><td class="num">${m.apiCalls}</td><td class="num">$${m.costUsd.toFixed(2)}</td></tr>`)
			.join("");
		sections.push(`<section><h2>Burn rate — ${esc(burn.agent)} (${burn.period.days}d)</h2><div class="tiles">
			${tile("total", `$${burn.cost.total.toFixed(2)}`)}
			${tile("sessions", String(burn.period.sessions))}
			${tile("api calls", String(burn.period.api_calls))}
		</div>
		<div class="spark-block">${sparkline(burn.by_day.map((d) => d.costUsd))}</div>
		${models ? `<table>${models}</table>` : ""}
		</section>`);
	}

	if (context) {
		const sources = context.sources
			.slice(0, 8)
			.map((s) => `<tr><td>${esc(s.name)}</td><td class="num">${s.tokens.toLocaleString()} tok</td></tr>`)
			.join("");
		sections.push(`<section><h2>Context tax</h2><div class="tiles">
			${tile("always loaded", `${context.always_loaded.total_tokens.toLocaleString()} tok`)}
			${tile("cache savings", `${context.session_estimate.savings_pct}%`)}
		</div>
		${sources ? `<table>${sources}</table>` : ""}
		</section>`);
	}

	return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>
	body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 8px 20px 40px; max-width: 780px; margin: 0 auto; }
	h2 { font-size: 0.95em; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.75; margin: 26px 0 10px; }
	.tiles { display: flex; gap: 10px; flex-wrap: wrap; }
	.tile { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 10px 16px; min-width: 90px; }
	.tile-value { font-size: 1.4em; font-weight: 600; }
	.tile-label { font-size: 0.75em; opacity: 0.65; margin-top: 2px; }
	table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.88em; }
	td { padding: 5px 8px; border-bottom: 1px solid var(--vscode-panel-border); }
	td.num { text-align: right; font-variant-numeric: tabular-nums; }
	.chip { display: inline-block; font-size: 0.75em; padding: 2px 9px; border-radius: 10px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); margin: 8px 4px 0 0; }
	.spark-block { margin: 10px 0; }
</style></head>
<body>${sections.join("") || "<p>No data yet. Run <code>skillkit scan</code>.</p>"}</body></html>`;
}

export async function openDashboardPanel(): Promise<void> {
	const panel = vscode.window.createWebviewPanel("agentfilesDashboard", "agentfiles Dashboard", vscode.ViewColumn.Active, {
		enableScripts: false,
	});
	if (!isSkillkitAvailable()) {
		panel.webview.html = notInstalledHtml();
		return;
	}
	panel.webview.html = `<html><body style="font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 24px;">Loading analytics...</body></html>`;
	const [stats, health, burnArr, context] = await Promise.all([
		runSkillkitJsonAsync("stats"),
		runSkillkitJsonAsync("health"),
		runSkillkitJsonAsync("burn"),
		runSkillkitJsonAsync("context"),
	]);
	const burn = Array.isArray(burnArr) ? ((burnArr[0] as BurnAgent) ?? null) : null;
	panel.webview.html = dashboardHtml(
		stats as StatsJson | null,
		health as HealthJson | null,
		burn,
		context as ContextJson | null,
	);
}
