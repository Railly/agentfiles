import { homedir } from "os";
import { existsSync } from "fs";
import { join } from "path";
import type { ToolConfig, ProjectSkillPath } from "./types";

const HOME = homedir();
const XDG_CONFIG = process.env.XDG_CONFIG_HOME || join(HOME, ".config");

function appExists(name: string): boolean {
	return (
		existsSync(`/Applications/${name}.app`) ||
		existsSync(join(HOME, "Applications", `${name}.app`))
	);
}

function cliExists(name: string): boolean {
	const paths = [
		`/usr/local/bin/${name}`,
		`/opt/homebrew/bin/${name}`,
		join(HOME, ".local", "bin", name),
	];
	for (const p of paths) {
		if (existsSync(p)) return true;
	}
	const nvmDir = join(HOME, ".nvm", "versions", "node");
	try {
		const { readdirSync } = require("fs");
		for (const d of readdirSync(nvmDir)) {
			if (existsSync(join(nvmDir, d, "bin", name))) return true;
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
		projectPaths: [
			{ relDir: ".claude/commands", type: "command", pattern: "flat-md" },
			{ relDir: ".claude/skills", type: "skill", pattern: "directory-with-skillmd" },
			{ relDir: ".claude/agents", type: "agent", pattern: "flat-md" },
			{ relDir: "CLAUDE.md", type: "rule", pattern: "recursive-filename" },
		],
		isInstalled: () =>
			existsSync(join(HOME, ".claude", "settings.json")) ||
			existsSync(join(HOME, ".claude", "CLAUDE.md")) ||
			cliExists("claude"),
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
		projectPaths: [
			{ relDir: ".cursor/rules", type: "rule", pattern: "mdc" },
			{ relDir: ".cursorrules", type: "rule", pattern: "single-file" },
		],
		isInstalled: () =>
			appExists("Cursor") ||
			existsSync(join(HOME, ".cursor", "argv.json")),
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
		projectPaths: [
			{ relDir: ".windsurfrules", type: "rule", pattern: "single-file" },
			{ relDir: ".windsurf/rules", type: "rule", pattern: "mdc" },
		],
		isInstalled: () =>
			appExists("Windsurf") ||
			existsSync(join(HOME, ".codeium", "windsurf", "argv.json")),
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
		],
		agentPaths: [
			{
				baseDir: join(HOME, ".codex", "agents"),
				type: "agent",
				pattern: "flat-md",
			},
		],
		projectPaths: [
			{ relDir: "codex.md", type: "rule", pattern: "single-file" },
		],
		isInstalled: () =>
			existsSync(join(HOME, ".codex", "config.toml")) ||
			existsSync(join(HOME, ".codex", "auth.json")) ||
			cliExists("codex"),
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
		projectPaths: [
			{ relDir: ".github/copilot-instructions.md", type: "rule", pattern: "single-file" },
		],
		isInstalled: () =>
			existsSync(join(HOME, ".copilot")) || cliExists("copilot"),
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
		projectPaths: [
			{ relDir: ".amp/rules", type: "rule", pattern: "flat-md" },
		],
		isInstalled: () =>
			existsSync(join(XDG_CONFIG, "amp", "config.json")) ||
			existsSync(join(XDG_CONFIG, "amp", "settings.json")) ||
			cliExists("amp"),
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
		projectPaths: [],
		isInstalled: () =>
			appExists("OpenCode") ||
			existsSync(join(XDG_CONFIG, "opencode", "opencode.json")) ||
			existsSync(join(XDG_CONFIG, "opencode", "opencode.jsonc")) ||
			cliExists("opencode"),
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
		projectPaths: [],
		isInstalled: () => cliExists("pi"),
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
		projectPaths: [],
		isInstalled: () =>
			appExists("Antigravity") ||
			existsSync(join(HOME, ".gemini", "antigravity", "skills")) ||
			cliExists("antigravity"),
	},
	{
		id: "claude-desktop",
		name: "Claude Desktop",
		color: "#f97316",
		icon: "monitor",
		paths: [],
		agentPaths: [],
		projectPaths: [],
		isInstalled: () => appExists("Claude"),
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
		projectPaths: [],
		isInstalled: () => existsSync(join(HOME, ".agents", "skills")),
	},
	{
		id: "aider",
		name: "Aider",
		color: "#eab308",
		icon: "wrench",
		paths: [],
		agentPaths: [],
		projectPaths: [
			{ relDir: ".aider.conf.yml", type: "rule", pattern: "single-file" },
		],
		isInstalled: () => cliExists("aider"),
	},
];
