import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import * as vscode from "vscode";
import {
	formatInstalls,
	getPopularSkills,
	installSkillAsync,
	type MarketplaceSkill,
	removeSkillAsync,
	searchSkills,
	TOOL_TO_AGENT,
	updateAllSkillsAsync,
	VALID_AGENTS,
} from "../../src/marketplace";
import { formatLastUsed, getSkillTraces, getSkillkitStats, isSkillkitAvailable } from "../../src/skillkit";
import { TOOL_CONFIGS } from "../../src/tool-configs";
import type { SkillItem } from "../../src/types";

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function pickAgents(): Promise<string[] | undefined> {
	const installedToolIds = TOOL_CONFIGS.filter((t) => t.isInstalled()).map((t) => t.id);
	const agentIds = [...new Set(installedToolIds.map((t) => TOOL_TO_AGENT[t]).filter(Boolean))];
	const picks = await vscode.window.showQuickPick(
		VALID_AGENTS.filter((a) => agentIds.includes(a.id)).map((a) => ({ label: a.label, id: a.id, picked: true })),
		{ canPickMany: true, title: "Install for which agents?" },
	);
	if (!picks || picks.length === 0) return undefined;
	return picks.map((p) => p.id);
}

async function installFromMarketplace(skill: MarketplaceSkill, onDone: () => Promise<void>): Promise<void> {
	const agents = await pickAgents();
	if (!agents) return;
	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: `Installing ${skill.source}...` },
		async () => {
			const result = await installSkillAsync(skill.source, agents, { skillName: skill.skillId });
			if (result.success) {
				vscode.window.showInformationMessage(`Installed ${skill.name}`);
				await onDone();
			} else {
				vscode.window.showErrorMessage(`Install failed: ${result.output.slice(0, 300)}`);
			}
		},
	);
}

export async function browseMarketplace(onInstalled: () => Promise<void>): Promise<void> {
	const qp = vscode.window.createQuickPick<vscode.QuickPickItem & { skill: MarketplaceSkill }>();
	qp.title = "agentfiles Marketplace (skills.sh)";
	qp.placeholder = "Type to search skills, Enter to install";
	qp.busy = true;
	qp.show();

	const toItems = (skills: MarketplaceSkill[]) =>
		skills.map((s) => ({
			label: s.name,
			description: `${s.source} · ${formatInstalls(s.installs)} installs`,
			detail: s.description,
			skill: s,
		}));

	try {
		qp.items = toItems(await getPopularSkills());
	} catch {
		qp.items = [];
	}
	qp.busy = false;

	let timer: ReturnType<typeof setTimeout> | undefined;
	qp.onDidChangeValue((value) => {
		if (timer) clearTimeout(timer);
		timer = setTimeout(async () => {
			qp.busy = true;
			try {
				qp.items = toItems(value.trim() ? await searchSkills(value.trim()) : await getPopularSkills());
			} catch {
				qp.items = [];
			}
			qp.busy = false;
		}, 300);
	});

	qp.onDidAccept(async () => {
		const picked = qp.selectedItems[0];
		if (!picked) return;
		qp.hide();
		await installFromMarketplace(picked.skill, onInstalled);
	});
}

export function openSkillDetailPanel(item: SkillItem): void {
	const panel = vscode.window.createWebviewPanel("agentfilesSkillDetail", item.name, vscode.ViewColumn.Beside, {
		enableScripts: true,
	});

	const stats = isSkillkitAvailable() ? getSkillkitStats().get(item.name) : undefined;
	const traces = isSkillkitAvailable() ? getSkillTraces(item.name).slice(0, 10) : [];
	const fm = Object.entries(item.frontmatter || {})
		.filter(([k]) => k !== "description")
		.map(([k, v]) => `<tr><td class="key">${esc(k)}</td><td>${esc(typeof v === "string" ? v : JSON.stringify(v))}</td></tr>`)
		.join("");
	const traceRows = traces
		.map(
			(t) =>
				`<tr><td>${esc(new Date(t.timestamp).toLocaleString())}</td><td>${esc(t.model)}</td><td class="num">${t.tokens.toLocaleString()}</td><td class="num">$${t.cost.toFixed(4)}</td></tr>`,
		)
		.join("");

	panel.webview.html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';"><style>
	body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 8px 20px 32px; }
	h1 { font-size: 1.15em; margin-bottom: 4px; }
	.desc { opacity: 0.8; margin-bottom: 8px; }
	.meta { font-size: 0.82em; opacity: 0.65; display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
	.actions { display: flex; gap: 8px; margin-bottom: 18px; }
	button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; }
	button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
	h2 { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; margin: 18px 0 8px; }
	table { width: 100%; border-collapse: collapse; font-size: 0.86em; }
	td { padding: 4px 8px; border-bottom: 1px solid var(--vscode-panel-border); }
	td.key { opacity: 0.7; width: 130px; }
	td.num { text-align: right; font-variant-numeric: tabular-nums; }
	code { background: var(--vscode-textCodeBlock-background); padding: 1px 5px; border-radius: 3px; }
</style></head>
<body>
	<h1>${esc(item.name)}</h1>
	<div class="desc">${esc(item.description || "")}</div>
	<div class="meta">
		<span>${esc(item.type)}</span>
		<span>${item.tools.map(esc).join(", ")}</span>
		<span>${(item.fileSize / 1024).toFixed(1)} KB</span>
		${stats ? `<span>${stats.uses} uses · ${esc(formatLastUsed(stats.lastUsed))}</span>` : ""}
	</div>
	<div class="actions">
		<button class="primary" onclick="post('open')">Open file</button>
		<button onclick="post('reveal')">Reveal in Finder</button>
		<button onclick="post('copyPath')">Copy path</button>
	</div>
	${fm ? `<h2>Frontmatter</h2><table>${fm}</table>` : ""}
	${traceRows ? `<h2>Recent traces</h2><table><tr><td>when</td><td>model</td><td class="num">tokens</td><td class="num">cost</td></tr>${traceRows}</table>` : ""}
	<h2>Path</h2><code>${esc(item.filePath)}</code>
	<script>
		const vscodeApi = acquireVsCodeApi();
		function post(type) { vscodeApi.postMessage({ type }); }
	</script>
</body></html>`;

	panel.webview.onDidReceiveMessage(async (msg: { type: string }) => {
		if (msg.type === "open") {
			await vscode.window.showTextDocument(vscode.Uri.file(item.filePath), { viewColumn: vscode.ViewColumn.One });
		} else if (msg.type === "reveal") {
			await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(item.filePath));
		} else if (msg.type === "copyPath") {
			await vscode.env.clipboard.writeText(item.filePath);
			vscode.window.showInformationMessage("Path copied");
		}
	});
}

export async function createSkillFlow(onCreated: () => Promise<void>): Promise<void> {
	const toolPick = await vscode.window.showQuickPick(
		TOOL_CONFIGS.filter((t) => t.isInstalled() && t.paths.length > 0).map((t) => ({ label: t.name, tool: t })),
		{ title: "Create skill: choose tool" },
	);
	if (!toolPick) return;

	let sp = toolPick.tool.paths[0];
	if (toolPick.tool.paths.length > 1) {
		const typePick = await vscode.window.showQuickPick(
			toolPick.tool.paths.map((p) => ({ label: p.type, description: p.baseDir, sp: p })),
			{ title: "Create skill: choose type" },
		);
		if (!typePick) return;
		sp = typePick.sp;
	}

	const name = await vscode.window.showInputBox({ prompt: "Skill name", placeHolder: "my-skill" });
	if (!name) return;
	const slug = name
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
	if (!slug) {
		vscode.window.showErrorMessage("Invalid name");
		return;
	}

	let filePath: string;
	if (sp.pattern === "directory-with-skillmd") {
		const dir = join(sp.baseDir, slug);
		if (existsSync(dir)) {
			vscode.window.showErrorMessage(`Already exists: ${slug}`);
			return;
		}
		mkdirSync(dir, { recursive: true });
		filePath = join(dir, "SKILL.md");
		writeFileSync(filePath, ["---", `name: ${name}`, 'description: ""', "---", "", `# ${name}`, "", "## Instructions", "", ""].join("\n"), "utf-8");
	} else {
		if (!existsSync(sp.baseDir)) mkdirSync(sp.baseDir, { recursive: true });
		filePath = join(sp.baseDir, `${slug}.md`);
		if (existsSync(filePath)) {
			vscode.window.showErrorMessage(`Already exists: ${slug}.md`);
			return;
		}
		writeFileSync(filePath, ["---", 'description: ""', "---", "", `# ${name}`, ""].join("\n"), "utf-8");
	}

	await vscode.window.showTextDocument(vscode.Uri.file(filePath));
	await onCreated();
}

export async function removeSkillFlow(item: SkillItem, onRemoved: () => Promise<void>): Promise<void> {
	const confirm = await vscode.window.showWarningMessage(`Remove skill "${item.name}"?`, { modal: true }, "Remove");
	if (confirm !== "Remove") return;
	const result = await removeSkillAsync(item.name);
	if (result.success) {
		vscode.window.showInformationMessage(`Removed ${item.name}`);
		await onRemoved();
	} else {
		vscode.window.showErrorMessage(`Remove failed: ${result.output.slice(0, 300)}`);
	}
}

export async function removeSkillFlowByName(onRemoved: () => Promise<void>): Promise<void> {
	const name = await vscode.window.showInputBox({ prompt: "Skill name to remove", placeHolder: "my-skill" });
	if (!name) return;
	const confirm = await vscode.window.showWarningMessage(`Remove skill "${name}"?`, { modal: true }, "Remove");
	if (confirm !== "Remove") return;
	const result = await removeSkillAsync(name);
	if (result.success) {
		vscode.window.showInformationMessage(`Removed ${name}`);
		await onRemoved();
	} else {
		vscode.window.showErrorMessage(`Remove failed: ${result.output.slice(0, 300)}`);
	}
}

export async function updateAllFlow(onDone: () => Promise<void>): Promise<void> {
	await vscode.window.withProgress(
		{ location: vscode.ProgressLocation.Notification, title: "Updating all skills..." },
		async () => {
			const result = await updateAllSkillsAsync();
			if (result.success) {
				vscode.window.showInformationMessage(`Updated ${result.count} skills`);
				await onDone();
			} else {
				vscode.window.showErrorMessage(`Update failed: ${result.output.slice(0, 300)}`);
			}
		},
	);
}
