import * as vscode from "vscode";
import { watch, type FSWatcher } from "fs";
import {
	existsSync,
	readFileSync,
	writeFileSync,
	mkdirSync,
	rmSync,
	readdirSync,
} from "fs";
import { join, delimiter, dirname } from "path";
import { homedir, platform } from "os";
import { execSync, exec } from "child_process";
import { createHash } from "crypto";
import { scanAll, getInstalledTools } from "../../src/scanner";
import { clearInstallCache } from "../../src/tool-configs";
import { TOOL_CONFIGS } from "../../src/tool-configs";
import { parseAllConversationsSync } from "../../src/conversations/parser";
import { isSkillkitAvailable } from "../../src/skillkit";
import { DEFAULT_SETTINGS, type SkillItem, type ConversationItem, type ConversationMessage } from "../../src/types";
import { libraryHtml, sessionsHtml, dashboardHtml, marketplaceHtml } from "./panels";

interface SkillkitData {
	available: boolean;
	stats: {
		total_invocations: number;
		unique_skills: number;
		most_active_day: string;
		streak?: { current: number; longest: number };
		velocity?: { this_week: number; last_week: number; change_pct: number };
		top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
		period: { days: number };
	} | null;
	health: {
		installed: number;
		usage: { used_30d: number; unused_30d: number; never_used: string[] };
		metadata: { total_chars: number; budget: number; pct: number };
	} | null;
	burn: {
		agent: string;
		cost: { total: number };
		period: { days: number; sessions: number; api_calls: number };
		by_day: { date: string; costUsd: number }[];
		by_model: { model: string; apiCalls: number; costUsd: number }[];
	} | null;
	context: {
		always_loaded: { total_tokens: number; claude_md_tokens: number; skill_metadata_tokens: number; memory_tokens: number };
		session_estimate: { with_cache: number; without_cache: number; savings_pct: number };
	} | null;
}

const BUILTIN_TOOLS = new Set([
	"Read", "Write", "Edit", "MultiEdit", "Bash", "Glob", "Grep",
	"WebSearch", "WebFetch", "TodoRead", "TodoWrite", "Task", "Agent",
	"Skill", "LSP", "NotebookEdit", "AskFollowupQuestion",
	"AttemptCompletion", "SearchReplace", "InsertCodeBlock",
	"ReadImages", "ExecuteCommand", "ListFiles", "SearchFiles",
	"ReadFile", "WriteFile", "ReplaceInFile", "ListCodeDefinitionNames",
	"BrowserAction", "UseMcp", "shell", "shell_command",
	"update_plan", "create_plan", "read_file", "write_file",
	"execute_command", "spawn_agent", "write_stdin",
	"multi_tool_use.parallel",
]);

function _isRealSkill(name: string): boolean {
	return !BUILTIN_TOOLS.has(name) && !name.startsWith("mcp__") && !name.startsWith("mcp_");
}

let _skillkitBin: string | null | undefined;
function _getSkillkitBin(): string | null {
	if (_skillkitBin !== undefined) return _skillkitBin;
	const names = IS_WIN ? ["skillkit.cmd", "skillkit.exe", "skillkit"] : ["skillkit"];
	const dirs: string[] = IS_WIN
		? [join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "npm"), join(homedir(), ".bun", "bin")]
		: ["/usr/local/bin", "/opt/homebrew/bin", join(homedir(), ".local", "bin"), join(homedir(), ".bun", "bin")];
	const nvmDir = IS_WIN ? join(homedir(), "AppData", "Roaming", "nvm") : join(homedir(), ".nvm", "versions", "node");
	try { for (const d of readdirSync(nvmDir)) dirs.push(IS_WIN ? join(nvmDir, d) : join(nvmDir, d, "bin")); } catch {}
	for (const dir of dirs) for (const n of names) { const p = join(dir, n); if (existsSync(p)) { _skillkitBin = p; return p; } }
	_skillkitBin = null;
	return null;
}

function _runSkillkitJson(cmd: string): unknown {
	const bin = _getSkillkitBin();
	if (!bin) return null;
	try {
		const out = execSync(`${bin} ${cmd} --json`, {
			encoding: "utf-8",
			timeout: 15000,
			env: { ...process.env, NO_COLOR: "1", PATH: buildPath() },
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		const start = Math.min(
			...[out.indexOf("{"), out.indexOf("[")].filter((i) => i >= 0),
		);
		if (start === Number.POSITIVE_INFINITY) return null;
		return JSON.parse(out.slice(start));
	} catch {
		return null;
	}
}

function loadSkillkitData(): SkillkitData {
	if (!isSkillkitAvailable()) {
		return { available: false, stats: null, health: null, burn: null, context: null };
	}
	const rawStats = _runSkillkitJson("stats") as Record<string, unknown> | null;
	const rawHealth = _runSkillkitJson("health") as Record<string, unknown> | null;
	const rawBurn = _runSkillkitJson("burn") as unknown[] | null;
	const rawContext = _runSkillkitJson("context") as Record<string, unknown> | null;

	let stats = rawStats as SkillkitData["stats"];
	if (stats?.top_skills) {
		const filtered = stats.top_skills.filter((s) => _isRealSkill(s.name));
		const removedTotal = stats.top_skills
			.filter((s) => !_isRealSkill(s.name))
			.reduce((sum, s) => sum + s.total, 0);
		stats = {
			...stats,
			top_skills: filtered,
			total_invocations: Math.max(0, stats.total_invocations - removedTotal),
			unique_skills: filtered.length,
		};
	}

	return {
		available: true,
		stats,
		health: rawHealth as SkillkitData["health"],
		burn: rawBurn && rawBurn.length > 0 ? rawBurn[0] as SkillkitData["burn"] : null,
		context: rawContext as SkillkitData["context"],
	};
}

const HOME = homedir();
const IS_WIN = platform() === "win32";
const TAG_FILE = join(HOME, ".claude", "agentfiles-conversations.json");
const ENRICH_CACHE = join(HOME, ".skillkit", "enrichment-cache.json");
const LOCK_PATH = join(HOME, ".agents", ".skill-lock.json");
const API_BASE = "https://skills.sh/api";

interface ConversationTagData {
	customTags: Record<string, string[]>;
	favorites: string[];
}

interface EnrichmentCache {
	stats: Record<string, unknown>;
	conflicts: Record<string, { skillName: string; similarity: number }[]>;
	warnings: {
		oversized: { name: string; lines: number }[];
		longDesc: { name: string; chars: number }[];
	};
}

interface MarketplaceSkill {
	id: string;
	skillId: string;
	name: string;
	source: string;
	installs: number;
	description?: string;
	content?: string;
	installed?: boolean;
}

type SidebarFilter =
	| { kind: "all" }
	| { kind: "favorites" }
	| { kind: "tool"; toolId: string }
	| { kind: "type"; type: string }
	| { kind: "collection"; name: string }
	| { kind: "project"; project: string };

type ConversationSort = "date" | "messages";
type ConversationDateRange = "all" | "today" | "7d" | "30d" | "90d" | "180d";

type ConversationFilter =
	| { kind: "all-conversations" }
	| { kind: "conversation-project"; project: string }
	| { kind: "conversation-tag"; tag: string }
	| { kind: "conversation-favorites" };

function getNonce(): string {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getConfig(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration("agentfiles");
}

function buildPath(): string {
	const extra: string[] = IS_WIN
		? [
				join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "npm"),
				join(HOME, ".bun", "bin"),
				join(HOME, "AppData", "Local", "npm"),
		  ]
		: [
				"/usr/local/bin",
				"/opt/homebrew/bin",
				join(HOME, ".local", "bin"),
				join(HOME, ".bun", "bin"),
		  ];
	const nvmDir = IS_WIN
		? join(HOME, "AppData", "Roaming", "nvm")
		: join(HOME, ".nvm", "versions", "node");
	try {
		for (const d of readdirSync(nvmDir)) {
			extra.push(IS_WIN ? join(nvmDir, d) : join(nvmDir, d, "bin"));
		}
	} catch {}
	return [...extra, process.env.PATH || ""].join(delimiter);
}

function detectRunner(): string {
	const names = IS_WIN ? ["bunx.cmd", "bunx.exe", "bunx"] : ["bunx"];
	const dirs = IS_WIN
		? [join(HOME, ".bun", "bin"), join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "npm")]
		: [join(HOME, ".bun", "bin"), "/usr/local/bin", "/opt/homebrew/bin"];
	for (const dir of dirs) {
		for (const name of names) {
			if (existsSync(join(dir, name))) return join(dir, name);
		}
	}
	return "npx";
}

function getRunner(preference: "auto" | "npx" | "bunx" = "auto"): string {
	if (preference === "npx") return "npx";
	if (preference === "bunx") return detectRunner();
	return detectRunner();
}

function execAsync(cmd: string, timeout = 120000): Promise<{ success: boolean; output: string }> {
	return new Promise((resolve) => {
		exec(
			cmd,
			{
				encoding: "utf-8",
				timeout,
				env: { ...process.env, PATH: buildPath(), NO_COLOR: "1" },
				shell: IS_WIN ? "cmd.exe" : undefined,
			},
			(error, stdout) => {
				const out = String(stdout ?? "");
				if (
					!error ||
					out.includes("Done") ||
					out.includes("Installed") ||
					out.includes("Removed") ||
					out.includes("Updated")
				) {
					resolve({ success: true, output: out });
				} else {
					resolve({ success: false, output: error?.message ?? "Command failed" });
				}
			},
		);
	});
}

function getInstalledNames(): Set<string> {
	const names = new Set<string>();
	if (!existsSync(LOCK_PATH)) return names;
	try {
		const data = JSON.parse(readFileSync(LOCK_PATH, "utf-8"));
		if (data.skills) {
			for (const name of Object.keys(data.skills)) {
				names.add(name);
			}
		}
	} catch {}
	return names;
}

const AGENT_SKILL_DIRS = [
	join(HOME, ".claude", "skills"),
	join(HOME, ".cursor", "skills"),
	join(HOME, ".codex", "skills"),
	join(HOME, ".codeium", "windsurf", "skills"),
	join(HOME, ".config", "amp", "skills"),
	join(HOME, ".config", "opencode", "skills"),
	join(HOME, ".copilot", "skills"),
	join(HOME, ".agents", "skills"),
];

function cleanupCopies(skillName: string): void {
	for (const dir of AGENT_SKILL_DIRS) {
		const skillPath = join(dir, skillName);
		if (existsSync(skillPath)) {
			try {
				rmSync(skillPath, { recursive: true, force: true });
			} catch {}
		}
	}
	const lockPath = join(HOME, ".agents", ".skill-lock.json");
	if (!existsSync(lockPath)) return;
	try {
		const data = JSON.parse(readFileSync(lockPath, "utf-8"));
		if (data.skills && data.skills[skillName]) {
			delete data.skills[skillName];
			writeFileSync(lockPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
		}
	} catch {}
}

const POPULAR_CACHE = join(HOME, ".skillkit", "marketplace-popular.json");

async function marketplacePopular(): Promise<MarketplaceSkill[]> {
	// Try disk cache first
	try {
		if (existsSync(POPULAR_CACHE)) {
			const cached = JSON.parse(readFileSync(POPULAR_CACHE, "utf-8")) as MarketplaceSkill[];
			if (cached.length > 0) {
				const installed = getInstalledNames();
				for (const s of cached) s.installed = installed.has(s.name);
				// Refresh in background
				void refreshPopularCache();
				return cached;
			}
		}
	} catch {}
	return refreshPopularCache();
}

async function refreshPopularCache(): Promise<MarketplaceSkill[]> {
	const queries = ["react", "next", "clerk", "stripe", "ai"];
	const seen = new Set<string>();
	const results: MarketplaceSkill[] = [];
	for (const q of queries) {
		const skills = await marketplaceSearch(q);
		for (const s of skills) {
			if (!seen.has(s.id)) { seen.add(s.id); results.push(s); }
		}
	}
	const sorted = results.sort((a, b) => b.installs - a.installs).slice(0, 20);
	try { writeFileSync(POPULAR_CACHE, JSON.stringify(sorted), "utf-8"); } catch {}
	return sorted;
}

async function marketplaceSearch(query: string): Promise<MarketplaceSkill[]> {
	if (query.length < 2) return [];
	try {
		const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=30`);
		const data = (await res.json()) as { skills?: { id: string; skillId: string; name: string; installs: number; source: string }[] };
		if (!data.skills) return [];
		const installed = getInstalledNames();
		return data.skills.map((s) => ({ ...s, installed: installed.has(s.name) }));
	} catch {
		return [];
	}
}

async function marketplaceInstall(
	source: string,
	agents: string[],
	runner: "auto" | "npx" | "bunx",
	global: boolean,
	skillName?: string,
): Promise<{ success: boolean; output: string }> {
	const agentFlag = agents.length > 0 ? `-a ${agents.join(" ")}` : "-a '*'";
	const globalFlag = global ? "-g" : "";
	const skillFlag = skillName ? `-s ${skillName}` : "";
	const resolvedRunner = getRunner(runner);
	const cmd = `${resolvedRunner} skills add ${source} ${agentFlag} ${globalFlag} ${skillFlag} -y`
		.replace(/\s+/g, " ")
		.trim();
	return execAsync(cmd);
}

async function marketplaceUninstall(
	skillName: string,
	runner: "auto" | "npx" | "bunx",
): Promise<{ success: boolean; output: string }> {
	const resolvedRunner = getRunner(runner);
	const cmd = `${resolvedRunner} skills remove ${skillName} -y`;
	const result = await execAsync(cmd, 30000);
	cleanupCopies(skillName);
	return { success: true, output: result.output || `Cleaned ${skillName}` };
}

function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "")
		.replace(/\.{2,}/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 80);
}

function formatTimestamp(ts: string): string {
	if (!ts) return "";
	const d = new Date(ts);
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function generateNoteContent(
	conv: ConversationItem & { customTags?: string[]; isFavorite?: boolean },
	selectedMessages: ConversationMessage[],
): string {
	const customTags = conv.customTags ?? [];
	const allTags = [...conv.tags, ...customTags];
	const tagList = allTags.map((t) => `"${t}"`).join(", ");

	const lines: string[] = [];
	lines.push("---");
	lines.push(`tags: [claude-session, ${tagList}]`);
	lines.push(`session: ${conv.uuid}`);
	lines.push(`project: ${conv.project}`);
	lines.push(`date: ${conv.firstTimestamp ? new Date(conv.firstTimestamp).toISOString().slice(0, 10) : "unknown"}`);
	lines.push(`messages: ${conv.messageCount}`);
	lines.push("---");
	lines.push("");
	lines.push(`# ${conv.title.slice(0, 100)}`);
	lines.push("");
	lines.push("## Context");
	lines.push(`- **Project:** ${conv.project}`);
	lines.push(`- **Started:** ${formatTimestamp(conv.firstTimestamp)}`);
	lines.push(`- **Last activity:** ${formatTimestamp(conv.lastTimestamp)}`);
	lines.push(`- **Messages:** ${conv.messageCount}`);
	if (allTags.length > 0) {
		lines.push(`- **Tags:** ${allTags.map((t) => `\`${t}\``).join(" ")}`);
	}
	lines.push("");

	if (selectedMessages.length > 0) {
		lines.push("## Key Snippets");
		lines.push("");
		for (const msg of selectedMessages) {
			const icon = msg.role === "human" ? "You" : "Claude";
			const time = formatTimestamp(msg.timestamp);
			lines.push(`### ${icon} ${time ? `(${time})` : ""}`);
			lines.push("");
			if (msg.role === "human") {
				lines.push(`> ${msg.text.replace(/\n/g, "\n> ")}`);
			} else {
				lines.push(msg.text);
			}
			lines.push("");
		}
	}

	lines.push("## Resume");
	lines.push("");
	lines.push("```bash");
	lines.push(`claude --resume ${conv.uuid}`);
	lines.push("```");

	return lines.join("\n");
}

interface TagRule {
	tag: string;
	patterns: RegExp[];
}

const TECH_TAGS: TagRule[] = [
	{ tag: "react", patterns: [/\breact\b/i, /\.tsx\b/, /\.jsx\b/, /usestate|useeffect|useref/i] },
	{ tag: "react-native", patterns: [/react.native/i, /\bexpo\b/i, /react-navigation/i] },
	{ tag: "nextjs", patterns: [/next\.js/i, /\bnextjs\b/i, /next\.config/i] },
	{ tag: "vue", patterns: [/\bvue\b/i, /\.vue\b/, /vuex|pinia/i] },
	{ tag: "angular", patterns: [/\bangular\b/i, /\.component\.ts/i] },
	{ tag: "svelte", patterns: [/\bsvelte\b/i, /\.svelte\b/] },
	{ tag: "typescript", patterns: [/typescript/i, /tsconfig/i, /\.tsx\b/] },
	{ tag: "javascript", patterns: [/javascript/i, /\.js\b/, /\.mjs\b/] },
	{ tag: "python", patterns: [/\bpython\b/i, /\.py\b/, /\bpip\b/i, /django|flask|fastapi/i] },
	{ tag: "rust", patterns: [/\brust\b/i, /\.rs\b/, /cargo\.toml/i] },
	{ tag: "go", patterns: [/\bgolang\b/i, /\.go\b/, /go\.mod/i] },
	{ tag: "java", patterns: [/\bjava\b/i, /\.java\b/, /gradle|maven/i] },
	{ tag: "csharp", patterns: [/\bc#\b/i, /\.cs\b/, /unity|dotnet/i] },
	{ tag: "swift", patterns: [/\bswift\b/i, /\.swift\b/, /swiftui/i] },
	{ tag: "nestjs", patterns: [/nestjs/i, /\bnest\b/i, /@nestjs\//] },
	{ tag: "tailwind", patterns: [/tailwind/i, /tailwindcss/i] },
	{ tag: "css", patterns: [/\.css\b/, /\.scss\b/, /\.sass\b/, /styled-components/i] },
	{ tag: "node", patterns: [/node\.js/i, /\bnodejs\b/i, /package\.json/i, /\bnpm\b/i] },
	{ tag: "docker", patterns: [/\bdocker\b/i, /dockerfile/i, /docker-compose/i] },
	{ tag: "sql", patterns: [/\bsql\b/i, /postgres|mysql|sqlite/i, /prisma|typeorm|sequelize/i] },
	{ tag: "mongodb", patterns: [/\bmongo\b/i, /mongodb/i, /mongoose/i] },
	{ tag: "graphql", patterns: [/graphql/i, /\.graphql\b/, /apollo/i] },
	{ tag: "git", patterns: [/\bgit\s+(commit|push|pull|merge|rebase|checkout|branch)/i] },
	{ tag: "unity", patterns: [/\bunity\b/i, /gameobject|monobehaviour/i, /\.unity\b/] },
	{ tag: "blender", patterns: [/\bblender\b/i, /\.blend\b/, /bpy\./i] },
	{ tag: "threejs", patterns: [/three\.js/i, /threejs/i, /\br3f\b/i, /react-three/i] },
	{ tag: "aws", patterns: [/\baws\b/i, /lambda|s3|ec2|dynamodb/i] },
	{ tag: "firebase", patterns: [/firebase/i, /firestore/i] },
	{ tag: "testing", patterns: [/\bjest\b/i, /\bvitest\b/i, /\.test\.|\.spec\./i, /testing/i] },
];

const TASK_TAGS: TagRule[] = [
	{ tag: "bug-fix", patterns: [/\bfix\b/i, /\bbug\b/i, /\berror\b/i, /broken/i, /not working/i, /no funciona/i, /arregl/i] },
	{ tag: "feature", patterns: [/\badd\b/i, /\bcreate\b/i, /\bimplement\b/i, /\bnew\b/i, /agreg/i, /crea /i] },
	{ tag: "refactor", patterns: [/refactor/i, /restructur/i, /reorganiz/i, /clean.?up/i] },
	{ tag: "styling", patterns: [/\bcss\b/i, /\bstyle\b/i, /\bdesign\b/i, /layout/i, /responsive/i, /color/i, /estilo/i] },
	{ tag: "config", patterns: [/config/i, /setup/i, /install/i, /\.env\b/i, /configur/i] },
	{ tag: "api", patterns: [/\bapi\b/i, /endpoint/i, /fetch|axios/i, /request/i, /rest\b/i] },
	{ tag: "auth", patterns: [/auth/i, /login/i, /password/i, /token/i, /session/i, /jwt/i] },
	{ tag: "database", patterns: [/database/i, /migration/i, /schema/i, /seed/i, /query/i] },
	{ tag: "deployment", patterns: [/deploy/i, /ci.?cd/i, /pipeline/i, /production/i, /vercel|netlify|heroku/i] },
	{ tag: "documentation", patterns: [/\bdocs?\b/i, /readme/i, /documentation/i, /comment/i] },
	{ tag: "performance", patterns: [/performance/i, /optimi[zs]/i, /slow/i, /fast/i, /cache/i, /lazy/i] },
	{ tag: "ui-ux", patterns: [/\bui\b/i, /\bux\b/i, /component/i, /button|modal|dialog|form/i, /animation/i] },
];

function countMatches(text: string, pattern: RegExp): number {
	const global = new RegExp(
		pattern.source,
		pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g",
	);
	const matches = text.match(global);
	return matches ? matches.length : 0;
}

function matchTags(text: string, rules: TagRule[], minHits = 1): string[] {
	const matched: string[] = [];
	for (const rule of rules) {
		let totalHits = 0;
		for (const p of rule.patterns) {
			totalHits += countMatches(text, p);
		}
		if (totalHits >= minHits) matched.push(rule.tag);
	}
	return matched;
}

type ConversationItemWithExtras = ConversationItem & {
	customTags: string[];
	isFavorite: boolean;
};

function generateTags(conv: ConversationItemWithExtras): string[] {
	const tags = new Set<string>();

	if (conv.project && conv.project !== "root") {
		tags.add(conv.project);
	}

	const humanMessages = conv.messages.filter((m) => m.role === "human").slice(0, 5);
	const searchText = humanMessages
		.map((m) => m.text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ""))
		.join(" ");

	const assistantMessages = conv.messages.filter((m) => m.role === "assistant");
	const allToolCalls = assistantMessages.flatMap((m) => m.toolCalls || []);

	for (const tag of matchTags(searchText, TECH_TAGS, 3)) tags.add(tag);
	for (const tag of matchTags(searchText, TASK_TAGS, 2)) tags.add(tag);

	if (allToolCalls.some((t) => t.includes("mcp__blender"))) tags.add("blender");
	if (allToolCalls.some((t) => t.includes("mcp-unity") || t.includes("mcp__mcp-unity"))) {
		tags.add("unity");
	}

	return Array.from(tags).sort();
}

function loadTagData(): ConversationTagData {
	try {
		if (existsSync(TAG_FILE)) {
			return JSON.parse(readFileSync(TAG_FILE, "utf-8")) as ConversationTagData;
		}
	} catch {}
	return { customTags: {}, favorites: [] };
}

function saveTagData(data: ConversationTagData): void {
	try {
		const dir = dirname(TAG_FILE);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
		writeFileSync(TAG_FILE, JSON.stringify(data, null, 2), "utf-8");
	} catch {}
}

function applyTagData(convs: ConversationItemWithExtras[], tagData: ConversationTagData): void {
	for (const item of convs) {
		item.customTags = tagData.customTags[item.uuid] || [];
		item.isFavorite = tagData.favorites.includes(item.uuid);
	}
}

function filterConversations(
	items: ConversationItemWithExtras[],
	filter: ConversationFilter,
	dateRange: ConversationDateRange,
	activeTags: string[],
	searchQuery: string,
	sort: ConversationSort,
): ConversationItemWithExtras[] {
	let result = items;

	switch (filter.kind) {
		case "conversation-project":
			result = result.filter((c) => c.project === filter.project);
			break;
		case "conversation-tag":
			result = result.filter(
				(c) => c.tags.includes(filter.tag) || c.customTags.includes(filter.tag),
			);
			break;
		case "conversation-favorites":
			result = result.filter((c) => c.isFavorite);
			break;
	}

	if (dateRange !== "all") {
		const now = Date.now();
		const days = { today: 1, "7d": 7, "30d": 30, "90d": 90, "180d": 180 }[dateRange];
		if (days !== undefined) {
			const cutoff = now - days * 86400000;
			result = result.filter((c) => new Date(c.lastTimestamp).getTime() >= cutoff);
		}
	}

	if (activeTags.length > 0) {
		result = result.filter((c) => {
			const allTags = [...c.tags, ...c.customTags];
			return activeTags.every((t) => allTags.includes(t));
		});
	}

	if (searchQuery) {
		const q = searchQuery.toLowerCase();
		result = result.filter(
			(c) =>
				c.title.toLowerCase().includes(q) ||
				c.project.toLowerCase().includes(q) ||
				c.tags.some((t) => t.includes(q)) ||
				c.customTags.some((t) => t.includes(q)) ||
				c.messages.some((m) => m.text.toLowerCase().includes(q)),
		);
	}

	if (sort === "messages") {
		result = [...result].sort((a, b) => b.messageCount - a.messageCount);
	}

	return result;
}

function filterSkills(
	items: SkillItem[],
	filter: SidebarFilter,
	searchQuery: string,
	deepSearch: boolean,
	deepSearchScope: string,
	projectsHomeDir: string,
): SkillItem[] {
	let result = items;

	switch (filter.kind) {
		case "favorites":
			result = result.filter((i) => i.isFavorite);
			break;
		case "tool":
			result = result.filter((i) => i.tools.includes(filter.toolId));
			break;
		case "type":
			result = result.filter((i) => i.type === filter.type);
			break;
		case "collection":
			result = result.filter((i) => i.collections.includes(filter.name));
			break;
		case "project":
			result = result.filter((i) => getProjectName(i.filePath, projectsHomeDir) === filter.project);
			break;
	}

	if (searchQuery) {
		const q = searchQuery.toLowerCase();
		const searchDesc =
			deepSearch && (deepSearchScope === "description" || deepSearchScope === "both");
		const searchContent =
			deepSearch && (deepSearchScope === "content" || deepSearchScope === "both");
		result = result.filter(
			(i) =>
				i.name.toLowerCase().includes(q) ||
				(searchDesc && i.description.toLowerCase().includes(q)) ||
				(searchContent && i.content.toLowerCase().includes(q)),
		);
	}

	return result.sort((a, b) => a.name.localeCompare(b.name));
}

function getProjectName(filePath: string, projectsHomeDir: string): string {
	if (!projectsHomeDir) return "root";
	const normalizedHome = projectsHomeDir.replace(/^~/, HOME);
	if (!filePath.startsWith(normalizedHome)) return "root";
	const rel = filePath.slice(normalizedHome.length).replace(/^[\\/]/, "");
	const parts = rel.split(/[\\/]/);
	return parts[0] || "root";
}

export function activateRichUi(context: vscode.ExtensionContext): { refreshAll: () => Promise<void>; conversations: () => ConversationItemWithExtras[] } {
	const store = new AgentfilesStore(context);

	const libraryProvider = new PanelProvider("library", store);
	const sessionsProvider = new PanelProvider("sessions", store);
	const dashboardProvider = new PanelProvider("dashboard", store);
	const marketplaceProvider = new PanelProvider("marketplace", store);

	store.registerProvider("library", libraryProvider);
	store.registerProvider("sessions", sessionsProvider);
	store.registerProvider("dashboard", dashboardProvider);
	store.registerProvider("marketplace", marketplaceProvider);

	const opts = { webviewOptions: { retainContextWhenHidden: true } };
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider("agentfiles.library", libraryProvider, opts),
		vscode.window.registerWebviewViewProvider("agentfiles.sessions", sessionsProvider, opts),
		vscode.window.registerWebviewViewProvider("agentfiles.dashboard", dashboardProvider, opts),
		vscode.window.registerWebviewViewProvider("agentfiles.marketplace", marketplaceProvider, opts),
	);

	const provider = store;

	context.subscriptions.push(
		vscode.commands.registerCommand("agentfiles.refresh", async () => {
			await provider.refreshAll();
			const counts = provider.getCounts();
			vscode.window.showInformationMessage(
				`Agentfiles: ${counts.skills} skills, ${counts.conversations} sessions`,
			);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("agentfiles.openSkill", (filePath: string) => {
			vscode.window.showTextDocument(vscode.Uri.file(filePath));
		}),
	);


	context.subscriptions.push(
		vscode.commands.registerCommand("agentfiles.openDashboard", () => {
			provider.focusView();
		}),
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("agentfiles")) {
				provider.onSettingsChanged();
			}
		}),
	);

	return { refreshAll: () => provider.refreshAll(), conversations: () => provider.conversations };
}

class PanelProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	constructor(private readonly _panel: string, private readonly _store: AgentfilesStore) {}
	resolveWebviewView(webviewView: vscode.WebviewView) {
		console.log(`[agentfiles] resolveWebviewView: ${this._panel}`);
		this._view = webviewView;
		webviewView.webview.options = { enableScripts: true };
		try {
			this._store.registerPanel(this._panel, webviewView);
			this._updateHtml();
			console.log(`[agentfiles] ${this._panel} HTML set, length: ${webviewView.webview.html.length}`);
		} catch (err) {
			console.error(`[agentfiles] ${this._panel} error:`, err);
			webviewView.webview.html = `<html><body><pre style="color:red">${String(err)}</pre></body></html>`;
		}
		webviewView.webview.onDidReceiveMessage((msg) => this._store.handleMessage(this._panel, msg));
		webviewView.onDidChangeVisibility(() => { if (webviewView.visible) this._updateHtml(); });
	}
	private _updateHtml() {
		if (!this._view) return;
		const nonce = getNonce();
		const s = this._store;
		switch (this._panel) {
			case "library":
				this._view.webview.html = libraryHtml(Array.from(s.skills.values()), s.installedTools, nonce);
				break;
			case "sessions":
				this._view.webview.html = sessionsHtml(s.conversations, nonce);
				break;
			case "dashboard":
				this._view.webview.html = dashboardHtml(Array.from(s.skills.values()), s.conversations, s.installedTools, s.skillkitData, nonce);
				break;
			case "marketplace":
				this._view.webview.html = marketplaceHtml(nonce);
				break;
		}
	}
	refresh() { this._updateHtml(); }
}

class AgentfilesStore {
	private _panels = new Map<string, vscode.WebviewView>();
	private _view?: vscode.WebviewView; // legacy compat
	private _watchers: FSWatcher[] = [];
	private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

	private _skills: Map<string, SkillItem> = new Map();
	private _conversations: ConversationItemWithExtras[] = [];
	private _skillkitData: SkillkitData = {
		available: false,
		stats: null,
		health: null,
		burn: null,
		context: null,
	};
	private _tagData: ConversationTagData = { customTags: {}, favorites: [] };
	private _favorites: Set<string> = new Set();

	private _skillFilter: SidebarFilter = { kind: "all" };
	private _skillSearch = "";
	private _deepSearch = false;
	private _deepSearchScope = "both";

	private _convFilter: ConversationFilter = { kind: "all-conversations" };
	private _convSort: ConversationSort = "date";
	private _convDateRange: ConversationDateRange = "today";
	private _convActiveTags: string[] = [];
	private _convSearch = "";
	private _convLoading = false;

	private _providers = new Map<string, PanelProvider>();

	constructor(private readonly _context: vscode.ExtensionContext) {
		const cfg = getConfig();
		this._deepSearch = cfg.get<boolean>("deepSearchDefault") ?? false;
		this._deepSearchScope = cfg.get<string>("deepSearchScope") ?? "both";
		this._loadFavorites();
		this._tagData = loadTagData();

		// Eager load skills + skillkit (both sync, fast)
		this._skills = scanAll(DEFAULT_SETTINGS);
		this._applyFavoritesToSkills();
		this._skillkitData = loadSkillkitData();

		// Load conversations in background (slow ~900ms), then notify panels
		setTimeout(() => {
			this._conversations = parseAllConversationsSync() as ConversationItemWithExtras[];
			for (const c of this._conversations) c.tags = generateTags(c);
			applyTagData(this._conversations, this._tagData);
			this._providers.get("sessions")?.refresh();
			this._providers.get("dashboard")?.refresh();
		}, 50);
	}

	registerProvider(name: string, provider: PanelProvider): void {
		this._providers.set(name, provider);
	}

	get skills(): Map<string, SkillItem> { return this._skills; }
	get conversations(): ConversationItemWithExtras[] { return this._conversations; }
	get skillkitData(): SkillkitData { return this._skillkitData; }
	get installedTools(): { id: string; name: string; color: string }[] {
		return getInstalledTools().map((id) => {
			const cfg = TOOL_CONFIGS.find((t) => t.id === id);
			return cfg ? { id: cfg.id, name: cfg.name, color: cfg.color } : null;
		}).filter(Boolean) as { id: string; name: string; color: string }[];
	}

	registerPanel(name: string, view: vscode.WebviewView): void {
		this._panels.set(name, view);
		this._view = view;
	}

	handleMessage(panel: string, msg: Record<string, unknown>): void {
		this._view = this._panels.get(panel);
		void this._handleMessage(msg);
	}

	focusView(): void {
		vscode.commands.executeCommand("agentfiles.library.focus");
	}

	getCounts(): { skills: number; conversations: number } {
		return { skills: this._skills.size, conversations: this._conversations.length };
	}

	private _loadConversationsAsync(): void {
		this._convLoading = true;
		setTimeout(() => {
			this._conversations = parseAllConversationsSync() as ConversationItemWithExtras[];
			for (const c of this._conversations) c.tags = generateTags(c);
			applyTagData(this._conversations, this._tagData);
			this._convLoading = false;
		}, 50);
	}

	// Legacy init removed — panels use PanelProvider now

	private async _handleMessage(msg: Record<string, unknown>): Promise<void> {
		if (!this._view) return;
		const post = (data: unknown) => this._view?.webview.postMessage(data);

		switch (msg.type) {
			case "selectSkill": {
				const id = msg.id as string;
				const skill = this._skills.get(id);
				if (!skill) break;
				post({
					type: "showSkillDetail",
					id: skill.id,
					name: skill.name,
					description: skill.description,
					content: skill.content,
					frontmatter: skill.frontmatter,
					filePath: skill.filePath,
					skillType: skill.type,
					tools: skill.tools,
					fileSize: skill.fileSize,
					lastModified: skill.lastModified,
					isFavorite: skill.isFavorite,
					usage: (skill as SkillItem & { usage?: unknown }).usage ?? null,
					warnings: (skill as SkillItem & { warnings?: unknown }).warnings ?? null,
					conflicts: (skill as SkillItem & { conflicts?: unknown }).conflicts ?? [],
					traces: (skill as SkillItem & { traces?: unknown }).traces ?? [],
				});
				break;
			}

			case "selectConversation": {
				const uuid = msg.id as string;
				const conv = this._conversations.find((c) => c.uuid === uuid);
				if (!conv) break;
				post({
					type: "showConvDetail",
					uuid: conv.uuid,
					title: conv.title,
					project: conv.project,
					messages: conv.messages,
					messageCount: conv.messageCount,
					firstTimestamp: conv.firstTimestamp,
					lastTimestamp: conv.lastTimestamp,
					tags: conv.tags,
					customTags: conv.customTags,
					isFavorite: conv.isFavorite,
					filePath: conv.filePath,
				});
				break;
			}

			case "toggleFavorite": {
				const id = msg.id as string;
				const skill = this._skills.get(id);
				if (!skill) break;
				skill.isFavorite = !skill.isFavorite;
				if (skill.isFavorite) {
					this._favorites.add(id);
				} else {
					this._favorites.delete(id);
				}
				this._saveFavorites();
				this._sendSkillsUpdate();
				break;
			}

			case "toggleConvFavorite": {
				const uuid = msg.uuid as string;
				const idx = this._tagData.favorites.indexOf(uuid);
				if (idx >= 0) {
					this._tagData.favorites.splice(idx, 1);
				} else {
					this._tagData.favorites.push(uuid);
				}
				saveTagData(this._tagData);
				const conv = this._conversations.find((c) => c.uuid === uuid);
				if (conv) conv.isFavorite = !conv.isFavorite;
				this._sendConvsUpdate();
				break;
			}

			case "search": {
				this._skillSearch = (msg.query as string) ?? "";
				this._sendSkillsUpdate();
				break;
			}

			case "setFilter": {
				this._skillFilter = (msg.filter as SidebarFilter) ?? { kind: "all" };
				this._sendSkillsUpdate();
				break;
			}

			case "setSort": {
				this._sendSkillsUpdate();
				break;
			}

			case "convSearch": {
				this._convSearch = (msg.query as string) ?? "";
				this._sendConvsUpdate();
				break;
			}

			case "convDateRange": {
				this._convDateRange = (msg.range as ConversationDateRange) ?? "today";
				this._sendConvsUpdate();
				break;
			}

			case "convSort": {
				this._convSort = (msg.sort as ConversationSort) ?? "date";
				this._sendConvsUpdate();
				break;
			}

			case "convToggleTag": {
				const tag = msg.tag as string;
				const tidx = this._convActiveTags.indexOf(tag);
				if (tidx >= 0) {
					this._convActiveTags.splice(tidx, 1);
				} else {
					this._convActiveTags.push(tag);
				}
				this._sendConvsUpdate();
				break;
			}

			case "convSetFilter": {
				this._convFilter = (msg.filter as ConversationFilter) ?? { kind: "all-conversations" };
				this._sendConvsUpdate();
				break;
			}

			case "addCustomTag": {
				const uuid = msg.uuid as string;
				const tag = msg.tag as string;
				if (!this._tagData.customTags[uuid]) this._tagData.customTags[uuid] = [];
				if (!this._tagData.customTags[uuid].includes(tag)) {
					this._tagData.customTags[uuid].push(tag);
				}
				saveTagData(this._tagData);
				const conv = this._conversations.find((c) => c.uuid === uuid);
				if (conv && !conv.customTags.includes(tag)) conv.customTags.push(tag);
				this._sendConvsUpdate();
				break;
			}

			case "removeCustomTag": {
				const uuid = msg.uuid as string;
				const tag = msg.tag as string;
				if (this._tagData.customTags[uuid]) {
					this._tagData.customTags[uuid] = this._tagData.customTags[uuid].filter(
						(t) => t !== tag,
					);
				}
				saveTagData(this._tagData);
				const conv = this._conversations.find((c) => c.uuid === uuid);
				if (conv) conv.customTags = conv.customTags.filter((t) => t !== tag);
				this._sendConvsUpdate();
				break;
			}

			case "openFile": {
				const path = msg.path as string;
				if (path && existsSync(path)) {
					vscode.window.showTextDocument(vscode.Uri.file(path));
				}
				break;
			}

			case "revealFile": {
				const path = msg.path as string;
				if (path) {
					vscode.commands.executeCommand(
						"revealFileInOS",
						vscode.Uri.file(path),
					);
				}
				break;
			}

			case "copyPath": {
				const path = msg.path as string;
				if (path) {
					await vscode.env.clipboard.writeText(path);
					vscode.window.showInformationMessage("Path copied to clipboard");
				}
				break;
			}

			case "copyResumeCmd": {
				const uuid = msg.uuid as string;
				if (uuid) {
					await vscode.env.clipboard.writeText(`claude --resume ${uuid}`);
					vscode.window.showInformationMessage("Resume command copied to clipboard");
				}
				break;
			}

			case "saveToVault": {
				const uuid = msg.uuid as string;
				const selectedMessages = (msg.selectedMessages as ConversationMessage[]) ?? [];
				const conv = this._conversations.find((c) => c.uuid === uuid);
				if (!conv) break;

				const cfg = getConfig();
				const vaultPath = cfg.get<string>("vaultPath") || join(HOME, "Documents");
				const date = conv.firstTimestamp
					? new Date(conv.firstTimestamp).toISOString().slice(0, 10)
					: "unknown-date";
				const slug = sanitizeFilename(conv.title.slice(0, 60));
				const notePath = join(vaultPath, "Claude Sessions", `${date}-${slug}.md`);
				const noteDir = dirname(notePath);

				try {
					if (!existsSync(noteDir)) mkdirSync(noteDir, { recursive: true });
					const content = generateNoteContent(conv, selectedMessages);
					writeFileSync(notePath, content, "utf-8");
					vscode.window.showTextDocument(vscode.Uri.file(notePath));
				} catch (e) {
					vscode.window.showErrorMessage(`Failed to save note: ${e instanceof Error ? e.message : String(e)}`);
				}
				break;
			}

			case "saveSkillEdit": {
				const filePath = msg.filePath as string;
				const content = msg.content as string;
				if (!filePath || content === undefined) break;
				try {
					writeFileSync(filePath, content, "utf-8");
					vscode.window.showInformationMessage("Skill saved");
					this._scheduleWatcherRefresh();
				} catch (e) {
					vscode.window.showErrorMessage(
						`Failed to save skill: ${e instanceof Error ? e.message : String(e)}`,
					);
				}
				break;
			}

			case "deleteSkill": {
				const id = msg.id as string;
				const skill = this._skills.get(id);
				if (!skill) break;
				const cfg = getConfig();
				const runner = cfg.get<"auto" | "npx" | "bunx">("packageRunner") ?? "auto";
				const result = await execAsync(
					`${getRunner(runner)} skills remove ${skill.name} -y`,
					30000,
				);
				if (result.success) {
					cleanupCopies(skill.name);
					vscode.window.showInformationMessage(`Skill "${skill.name}" removed`);
					this._skills.delete(id);
					this._sendSkillsUpdate();
				} else {
					vscode.window.showErrorMessage(`Failed to remove skill: ${result.output}`);
				}
				break;
			}

			case "marketplaceInit": {
				const popular = await marketplacePopular();
				post({ type: "marketplaceResults", skills: popular, title: "Popular" });
				break;
			}

			case "marketplaceSelectSkill": {
				const source = msg.source as string;
				const name = msg.name as string;
				const installs = (msg.installs as number) ?? 0;
				const installed = getInstalledNames().has(name);
				post({ type: "marketplacePreview", source, name, installs, installed, content: null });
				// Fetch content async
				try {
					const repoRes = await fetch(`https://api.github.com/repos/${source}`);
					const repoData = await repoRes.json() as { default_branch?: string };
					const branch = repoData.default_branch || "main";
					const treeRes = await fetch(`https://api.github.com/repos/${source}/git/trees/${branch}?recursive=1`);
					const treeData = await treeRes.json() as { tree?: { path: string }[] };
					const files = (treeData.tree || []).filter((t: { path: string }) => t.path.endsWith("/SKILL.md")).map((t: { path: string }) => t.path);
					const match = files.find((p: string) => p.includes(name)) || files[0] || `skills/${name}/SKILL.md`;
					const contentRes = await fetch(`https://raw.githubusercontent.com/${source}/${branch}/${match}`);
					const content = await contentRes.text();
					post({ type: "marketplacePreview", source, name, installs, installed, content });
				} catch {
					post({ type: "marketplacePreview", source, name, installs, installed, content: "Could not load content." });
				}
				break;
			}

			case "marketplaceSearch": {
				const query = (msg.query as string) ?? "";
				const results = await marketplaceSearch(query);
				post({ type: "marketplaceResults", skills: results, query });
				break;
			}

			case "marketplaceInstall": {
				const source = msg.source as string;
				const agents = (msg.agents as string[]) ?? [];
				const cfg = getConfig();
				const runner = cfg.get<"auto" | "npx" | "bunx">("packageRunner") ?? "auto";
				const global = (msg.global as boolean) ?? false;
				const skillName = msg.skillName as string | undefined;

				post({ type: "marketplaceInstallProgress", source, status: "installing" });
				const result = await marketplaceInstall(source, agents, runner, global, skillName);
				post({ type: "marketplaceInstallResult", source, ...result });

				if (result.success) {
					await this.refreshAll();
				}
				break;
			}

			case "marketplaceUninstall": {
				const skillName = msg.skillName as string;
				const cfg = getConfig();
				const runner = cfg.get<"auto" | "npx" | "bunx">("packageRunner") ?? "auto";

				post({ type: "marketplaceInstallProgress", skillName, status: "removing" });
				const result = await marketplaceUninstall(skillName, runner);
				post({ type: "marketplaceUninstallResult", skillName, ...result });

				if (result.success) {
					await this.refreshAll();
				}
				break;
			}

			case "refreshAll": {
				await this.refreshAll();
				break;
			}

			case "setDeepSearch": {
				this._deepSearch = (msg.enabled as boolean) ?? false;
				this._sendSkillsUpdate();
				break;
			}

			case "setDeepSearchScope": {
				this._deepSearchScope = (msg.scope as string) ?? "both";
				this._sendSkillsUpdate();
				break;
			}
		}
	}

	async refreshAll(): Promise<void> {
		clearInstallCache();
		this._skills = scanAll(DEFAULT_SETTINGS);
		this._loadFavorites();
		this._applyFavoritesToSkills();
		this._skillkitData = loadSkillkitData();
		await this._loadConversations();
		this._updateHtml();
	}

	onSettingsChanged(): void {
		const cfg = getConfig();
		this._deepSearch = cfg.get<boolean>("deepSearchDefault") ?? false;
		this._deepSearchScope = cfg.get<string>("deepSearchScope") ?? "both";

		const watchEnabled = cfg.get<boolean>("watchEnabled") ?? true;
		if (watchEnabled) {
			this._stopWatcher();
			this._startWatcher();
		} else {
			this._stopWatcher();
		}
		this._sendSkillsUpdate();
	}

	private async _loadConversations(): Promise<void> {
		this._convLoading = true;
		this._view?.webview.postMessage({ type: "conversationsLoading" });

		this._tagData = loadTagData();
		const raw = parseAllConversationsSync();

		this._conversations = raw.map((c) => ({
			...c,
			customTags: [],
			isFavorite: false,
		}));

		for (const conv of this._conversations) {
			conv.tags = generateTags(conv);
		}

		applyTagData(this._conversations, this._tagData);
		this._convLoading = false;
	}

	private _loadFavorites(): void {
		const stored = this._context.globalState.get<string[]>("agentfiles.favorites") ?? [];
		this._favorites = new Set(stored);
	}

	private _saveFavorites(): void {
		void this._context.globalState.update(
			"agentfiles.favorites",
			Array.from(this._favorites),
		);
	}

	private _applyFavoritesToSkills(): void {
		for (const [id, skill] of this._skills) {
			skill.isFavorite = this._favorites.has(id);
		}
	}

	private _sendSkillsUpdate(): void {
		if (!this._view) return;
		const cfg = getConfig();
		const projectsHomeDir = cfg.get<string>("projectsHomeDir") ?? "";
		const filtered = filterSkills(
			Array.from(this._skills.values()),
			this._skillFilter,
			this._skillSearch,
			this._deepSearch,
			this._deepSearchScope,
			projectsHomeDir,
		);
		this._view.webview.postMessage({
			type: "updateSkills",
			skills: filtered,
			total: this._skills.size,
			filter: this._skillFilter,
			searchQuery: this._skillSearch,
			deepSearch: this._deepSearch,
			deepSearchScope: this._deepSearchScope,
		});
	}

	private _sendConvsUpdate(): void {
		if (!this._view) return;
		const filtered = filterConversations(
			this._conversations,
			this._convFilter,
			this._convDateRange,
			this._convActiveTags,
			this._convSearch,
			this._convSort,
		);

		const allTagCounts = new Map<string, number>();
		for (const item of this._conversations) {
			for (const tag of [...item.tags, ...item.customTags]) {
				allTagCounts.set(tag, (allTagCounts.get(tag) || 0) + 1);
			}
		}

		const projectCounts = new Map<string, number>();
		for (const item of this._conversations) {
			projectCounts.set(item.project, (projectCounts.get(item.project) || 0) + 1);
		}

		this._view.webview.postMessage({
			type: "updateConversations",
			conversations: filtered,
			total: this._conversations.length,
			loading: this._convLoading,
			filter: this._convFilter,
			sort: this._convSort,
			dateRange: this._convDateRange,
			activeTags: this._convActiveTags,
			searchQuery: this._convSearch,
			allTags: Object.fromEntries(allTagCounts),
			projectCounts: Object.fromEntries(projectCounts),
		});
	}

	private _updateHtml(): void {
		// No-op: panels render themselves via PanelProvider
	}

	private _startWatcher(): void {
		const cfg = getConfig();
		const watchEnabled = cfg.get<boolean>("watchEnabled") ?? true;
		if (!watchEnabled) return;

		const paths = TOOL_CONFIGS.filter((t) => t.isInstalled()).flatMap((t) =>
			[...t.paths, ...t.agentPaths].map((p) => p.baseDir),
		);

		this._stopWatcher();
		for (const p of paths) {
			if (!existsSync(p)) continue;
			try {
				const w = watch(p, { recursive: true }, () => this._scheduleWatcherRefresh());
				this._watchers.push(w);
			} catch {}
		}
	}

	private _stopWatcher(): void {
		if (this._debounceTimer) {
			clearTimeout(this._debounceTimer);
			this._debounceTimer = null;
		}
		for (const w of this._watchers) {
			try {
				w.close();
			} catch {}
		}
		this._watchers = [];
	}

	private _scheduleWatcherRefresh(): void {
		const cfg = getConfig();
		const debounceMs = cfg.get<number>("watchDebounceMs") ?? 500;
		if (this._debounceTimer) clearTimeout(this._debounceTimer);
		this._debounceTimer = setTimeout(() => {
			this._debounceTimer = null;
			clearInstallCache();
			this._skills = scanAll(DEFAULT_SETTINGS);
			this._applyFavoritesToSkills();
			this._sendSkillsUpdate();
		}, debounceMs);
	}
}


