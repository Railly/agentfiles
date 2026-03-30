import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { requestUrl } from "obsidian";

const HOME = homedir();
const LOCK_PATH = join(HOME, ".agents", ".skill-lock.json");
const API_BASE = "https://skills.sh/api";

export interface MarketplaceSkill {
	id: string;
	skillId: string;
	name: string;
	source: string;
	installs: number;
	description?: string;
	content?: string;
	installed?: boolean;
}

export async function searchSkills(query: string): Promise<MarketplaceSkill[]> {
	if (query.length < 2) return [];
	try {
		const res = await requestUrl({
			url: `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=30`,
		});
		const data = res.json;
		if (!data.skills) return [];
		const installed = getInstalledNames();
		return data.skills.map((s: { id: string; skillId: string; name: string; installs: number; source: string }) => ({
			...s,
			installed: installed.has(s.name),
		}));
	} catch { /* empty */
		return [];
	}
}

const treeCache = new Map<string, { branch: string; files: string[] }>();

async function getRepoTree(source: string): Promise<{ branch: string; files: string[] }> {
	const cached = treeCache.get(source);
	if (cached) return cached;

	const repoRes = await requestUrl({ url: `https://api.github.com/repos/${source}` });
	const branch = repoRes.json.default_branch || "main";

	const treeRes = await requestUrl({
		url: `https://api.github.com/repos/${source}/git/trees/${branch}?recursive=1`,
	});
	const files = (treeRes.json.tree as { path: string }[])
		.filter((t) => t.path.endsWith("/SKILL.md"))
		.map((t) => t.path);

	const result = { branch, files };
	treeCache.set(source, result);
	return result;
}

function buildCandidateNames(skillName: string, skillId: string, source: string): Set<string> {
	const idParts = skillId.split("/");
	const folderName = idParts[idParts.length - 1] || skillName;
	const candidates = new Set([folderName, skillName]);

	for (const part of source.split("/")) {
		if (skillName.startsWith(part + "-")) {
			candidates.add(skillName.slice(part.length + 1));
		}
		for (const sub of part.split("-")) {
			if (skillName.startsWith(sub + "-")) {
				candidates.add(skillName.slice(sub.length + 1));
			}
		}
	}
	return candidates;
}

export async function fetchSkillContent(source: string, skillName: string, skillId: string): Promise<string | null> {
	try {
		const { branch, files } = await getRepoTree(source);
		const candidates = buildCandidateNames(skillName, skillId, source);

		let match = files.find((p) => {
			const dir = p.replace("/SKILL.md", "").split("/").pop() || "";
			return candidates.has(dir);
		});

		if (!match) {
			match = files.find((p) => {
				const dir = p.replace("/SKILL.md", "").split("/").pop() || "";
				return skillName.includes(dir) || dir.includes(skillName);
			});
		}

		const path = match || `skills/${skillName}/SKILL.md`;
		const contentRes = await requestUrl({
			url: `https://raw.githubusercontent.com/${source}/${branch}/${path}`,
		});
		return contentRes.text;
	} catch { /* empty */
		return null;
	}
}

export async function getPopularSkills(): Promise<MarketplaceSkill[]> {
	const queries = ["react", "next", "clerk", "stripe", "ai"];
	const seen = new Set<string>();
	const results: MarketplaceSkill[] = [];

	for (const q of queries) {
		const skills = await searchSkills(q);
		for (const s of skills) {
			if (!seen.has(s.id)) {
				seen.add(s.id);
				results.push(s);
			}
		}
	}

	return results.sort((a, b) => b.installs - a.installs).slice(0, 20);
}

function buildPath(): string {
	const extra = [
		"/usr/local/bin",
		"/opt/homebrew/bin",
		join(HOME, ".local", "bin"),
		join(HOME, ".bun", "bin"),
	];
	const nvmDir = join(HOME, ".nvm", "versions", "node");
	try {
		for (const d of readdirSync(nvmDir)) {
			extra.push(join(nvmDir, d, "bin"));
		}
	} catch { /* empty */ }
	return [...extra, process.env.PATH || ""].join(":");
}

function detectRunner(): string {
	const bunPath = join(HOME, ".bun", "bin", "bunx");
	if (existsSync(bunPath)) return bunPath;
	if (existsSync("/usr/local/bin/bunx")) return "bunx";
	if (existsSync("/opt/homebrew/bin/bunx")) return "bunx";
	return "npx";
}

function getRunner(preference: "auto" | "npx" | "bunx" = "auto"): string {
	if (preference === "npx") return "npx";
	if (preference === "bunx") return detectRunner();
	return detectRunner();
}

export const VALID_AGENTS: { id: string; label: string }[] = [
	{ id: "claude-code", label: "Claude Code" },
	{ id: "cursor", label: "Cursor" },
	{ id: "codex", label: "Codex" },
	{ id: "github-copilot", label: "GitHub Copilot" },
	{ id: "windsurf", label: "Windsurf" },
	{ id: "amp", label: "Amp" },
	{ id: "opencode", label: "OpenCode" },
	{ id: "cline", label: "Cline" },
	{ id: "gemini-cli", label: "Gemini CLI" },
	{ id: "goose", label: "Goose" },
	{ id: "kiro-cli", label: "Kiro" },
	{ id: "roo", label: "Roo Code" },
	{ id: "continue", label: "Continue" },
	{ id: "antigravity", label: "Antigravity" },
	{ id: "warp", label: "Warp" },
	{ id: "pi", label: "Pi" },
	{ id: "replit", label: "Replit" },
];

export const TOOL_TO_AGENT: Record<string, string> = {
	"claude-code": "claude-code",
	"cursor": "cursor",
	"codex": "codex",
	"copilot": "github-copilot",
	"windsurf": "windsurf",
	"amp": "amp",
	"opencode": "opencode",
	"antigravity": "antigravity",
	"claude-desktop": "claude-code",
	"pi": "pi",
	"global-agents": "claude-code",
	"aider": "claude-code",
};

export function installSkill(
	source: string,
	agents: string[],
	options: { runner?: "auto" | "npx" | "bunx"; global?: boolean } = {}
): { success: boolean; output: string } {
	const agentFlag = agents.length > 0 ? `-a ${agents.join(" ")}` : "-a '*'";
	const globalFlag = options.global ? "-g" : "";
	const resolvedRunner = getRunner(options.runner || "auto");
	const cmd = `${resolvedRunner} skills add ${source} ${agentFlag} ${globalFlag} -y`.replace(/\s+/g, " ").trim();
	try {
		const out = execSync(cmd, {
			encoding: "utf-8",
			timeout: 120000,
			env: { ...process.env, PATH: buildPath(), NO_COLOR: "1" },
			stdio: ["pipe", "pipe", "ignore"],
		}).trim();
		return { success: true, output: out };
	} catch (e: unknown) {
		if (e && typeof e === "object" && "stdout" in e) {
			const stdout = String((e as { stdout: unknown }).stdout || "");
			if (stdout.includes("Done") || stdout.includes("Installed")) {
				return { success: true, output: stdout };
			}
		}
		return { success: false, output: e instanceof Error ? e.message : "Install failed" };
	}
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
	} catch { /* empty */ }
	return names;
}

export function removeSkill(skillName: string, runner: "auto" | "npx" | "bunx" = "auto"): { success: boolean; output: string } {
	const resolvedRunner = getRunner(runner);
	const cmd = `${resolvedRunner} skills remove ${skillName} --all`;
	try {
		const out = execSync(cmd, {
			encoding: "utf-8",
			timeout: 30000,
			env: { ...process.env, PATH: buildPath(), NO_COLOR: "1" },
			stdio: ["pipe", "pipe", "ignore"],
		}).trim();
		return { success: true, output: out };
	} catch (e: unknown) {
		if (e && typeof e === "object" && "stdout" in e) {
			const stdout = String((e as { stdout: unknown }).stdout || "");
			if (stdout.includes("Removed") || stdout.includes("Done")) {
				return { success: true, output: stdout };
			}
		}
		return { success: false, output: e instanceof Error ? e.message : "Remove failed" };
	}
}

export function formatInstalls(n: number): string {
	if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
	return String(n);
}
