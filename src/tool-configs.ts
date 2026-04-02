import { homedir, platform } from "os";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import type { ToolConfig } from "./types";

const HOME = homedir();
const IS_WIN = platform() === "win32";
const XDG_CONFIG = process.env.XDG_CONFIG_HOME || (IS_WIN ? join(HOME, ".config") : join(HOME, ".config"));

const _installCache = new Map<string, boolean>();

export function clearInstallCache(): void {
	_installCache.clear();
}

function cached(id: string, check: () => boolean): boolean {
	const hit = _installCache.get(id);
	if (hit !== undefined) return hit;
	const result = check();
	_installCache.set(id, result);
	return result;
}

function appExists(name: string): boolean {
	if (IS_WIN) {
		const programFiles = process.env.ProgramFiles || "C:\\Program Files";
		const localAppData = process.env.LOCALAPPDATA || join(HOME, "AppData", "Local");
		return (
			existsSync(join(programFiles, name)) ||
			existsSync(join(localAppData, "Programs", name))
		);
	}
	return (
		existsSync(`/Applications/${name}.app`) ||
		existsSync(join(HOME, "Applications", `${name}.app`))
	);
}

function cliExists(name: string): boolean {
	const names = IS_WIN ? [`${name}.cmd`, `${name}.exe`, name] : [name];
	const dirs: string[] = [];
	if (IS_WIN) {
		const appData = process.env.APPDATA || join(HOME, "AppData", "Roaming");
		dirs.push(
			join(appData, "npm"),
			join(HOME, ".bun", "bin"),
			join(HOME, "AppData", "Local", "npm"),
		);
	} else {
		dirs.push(
			"/usr/local/bin",
			"/opt/homebrew/bin",
			join(HOME, ".local", "bin"),
		);
	}
	for (const dir of dirs) {
		for (const n of names) {
			if (existsSync(join(dir, n))) return true;
		}
	}
	const nvmDir = IS_WIN
		? join(HOME, "AppData", "Roaming", "nvm")
		: join(HOME, ".nvm", "versions", "node");
	try {
		for (const d of readdirSync(nvmDir)) {
			const binDir = IS_WIN ? join(nvmDir, d) : join(nvmDir, d, "bin");
			for (const n of names) {
				if (existsSync(join(binDir, n))) return true;
			}
		}
	} catch { /* empty */ }
	return false;
}

export const TOOL_CONFIGS: ToolConfig[] = [
	{
		id: "claude-code",
		name: "Claude Code",
		color: "#f97316",
		icon: "brain",
		paths: [
			{
				baseDir: join(HOME, ".claude", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
			{
				baseDir: join(HOME, ".claude", "commands"),
				type: "command",
				pattern: "flat-md",
			},
		],
		agentPaths: [
			{
				baseDir: join(HOME, ".claude", "agents"),
				type: "agent",
				pattern: "flat-md",
			},
		],
		isInstalled: () => cached("claude-code", () =>
			existsSync(join(HOME, ".claude", "settings.json")) ||
			existsSync(join(HOME, ".claude", "CLAUDE.md")) ||
			cliExists("claude")),
	},
	{
		id: "cursor",
		name: "Cursor",
		color: "#3b82f6",
		icon: "mouse-pointer",
		paths: [
			{
				baseDir: join(HOME, ".cursor", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
			{
				baseDir: join(HOME, ".cursor", "rules"),
				type: "rule",
				pattern: "flat-md",
			},
		],
		agentPaths: [
			{
				baseDir: join(HOME, ".cursor", "agents"),
				type: "agent",
				pattern: "flat-md",
			},
		],
		isInstalled: () => cached("cursor", () =>
			appExists("Cursor") ||
			existsSync(join(HOME, ".cursor", "argv.json"))),
	},
	{
		id: "windsurf",
		name: "Windsurf",
		color: "#14b8a6",
		icon: "wind",
		paths: [
			{
				baseDir: join(HOME, ".codeium", "windsurf", "memories"),
				type: "memory",
				pattern: "flat-md",
			},
			{
				baseDir: join(HOME, ".windsurf", "rules"),
				type: "rule",
				pattern: "flat-md",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("windsurf", () =>
			appExists("Windsurf") ||
			existsSync(join(HOME, ".codeium", "windsurf", "argv.json"))),
	},
	{
		id: "codex",
		name: "Codex",
		color: "#22c55e",
		icon: "book",
		paths: [
			{
				baseDir: join(HOME, ".codex", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
			{
				baseDir: join(HOME, ".codex", "prompts"),
				type: "command",
				pattern: "flat-md",
			},
			{
				baseDir: join(HOME, ".codex", "memories"),
				type: "memory",
				pattern: "flat-md",
			},
		],
		agentPaths: [
			{
				baseDir: join(HOME, ".codex", "agents"),
				type: "agent",
				pattern: "flat-md",
			},
		],
		isInstalled: () => cached("codex", () =>
			existsSync(join(HOME, ".codex", "config.toml")) ||
			existsSync(join(HOME, ".codex", "auth.json")) ||
			cliExists("codex")),
	},
	{
		id: "copilot",
		name: "Copilot",
		color: "#a855f7",
		icon: "plane",
		paths: [
			{
				baseDir: join(HOME, ".copilot", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("copilot", () =>
			existsSync(join(HOME, ".copilot")) || cliExists("copilot")),
	},
	{
		id: "amp",
		name: "Amp",
		color: "#ec4899",
		icon: "zap",
		paths: [
			{
				baseDir: join(XDG_CONFIG, "amp", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("amp", () =>
			existsSync(join(XDG_CONFIG, "amp", "config.json")) ||
			existsSync(join(XDG_CONFIG, "amp", "settings.json")) ||
			cliExists("amp")),
	},
	{
		id: "opencode",
		name: "OpenCode",
		color: "#ef4444",
		icon: "terminal",
		paths: [
			{
				baseDir: join(XDG_CONFIG, "opencode", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("opencode", () =>
			appExists("OpenCode") ||
			existsSync(join(XDG_CONFIG, "opencode", "opencode.json")) ||
			existsSync(join(XDG_CONFIG, "opencode", "opencode.jsonc")) ||
			cliExists("opencode")),
	},
	{
		id: "pi",
		name: "Pi",
		color: "#06b6d4",
		icon: "sparkles",
		paths: [
			{
				baseDir: join(HOME, ".pi", "agent", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("pi", () => cliExists("pi")),
	},
	{
		id: "antigravity",
		name: "Antigravity",
		color: "#ef4444",
		icon: "arrow-up-circle",
		paths: [
			{
				baseDir: join(HOME, ".gemini", "antigravity", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("antigravity", () =>
			appExists("Antigravity") ||
			existsSync(join(HOME, ".gemini", "antigravity", "skills")) ||
			cliExists("antigravity")),
	},
	{
		id: "claude-desktop",
		name: "Claude Desktop",
		color: "#f97316",
		icon: "monitor",
		paths: [],
		agentPaths: [],
		isInstalled: () => cached("claude-desktop", () => appExists("Claude")),
	},
	{
		id: "global-agents",
		name: "Global",
		color: "#a3e635",
		icon: "globe",
		paths: [
			{
				baseDir: join(HOME, ".agents", "skills"),
				type: "skill",
				pattern: "directory-with-skillmd",
			},
		],
		agentPaths: [],
		isInstalled: () => cached("global-agents", () => existsSync(join(HOME, ".agents", "skills"))),
	},
	{
		id: "aider",
		name: "Aider",
		color: "#eab308",
		icon: "wrench",
		paths: [],
		agentPaths: [],
		isInstalled: () => cached("aider", () => cliExists("aider")),
	},
];
