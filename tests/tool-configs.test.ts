import { describe, expect, mock, test } from "bun:test";
import { join } from "path";

const HOME = "/home/agentfiles-test";
const normalize = (path: string) => path.replaceAll("\\", "/");
let existsPredicate = (_path: string) => false;
let directoryEntries = new Map<string, string[]>();
let dynamicBinDirs = new Map<string, string>();

const existsSync = mock((path: unknown) => existsPredicate(normalize(String(path))));
const readdirSync = mock((path: unknown) => directoryEntries.get(normalize(String(path))) ?? []);
const execFileSync = mock((command: unknown, args: unknown[] = []) => {
	const normalizedCommand = normalize(String(command));
	if (existsPredicate(normalizedCommand)) return "Analytics for AI agent skills\n";

	const key = [String(command), ...args.map(String)].join(" ");
	const binDir = dynamicBinDirs.get(key);
	if (binDir) return `${binDir}\n`;

	throw new Error(`Unexpected command: ${key}`);
});

mock.module("os", () => ({
	homedir: () => HOME,
	platform: () => "linux",
}));

mock.module("fs", () => ({
	existsSync,
	readdirSync,
}));

mock.module("child_process", () => ({
	execFileSync,
	execFile: mock(() => undefined),
}));

const toolConfigs = await import("../src/tool-configs");
const skillkit = await import("../src/skillkit");

function resetDiscovery(): void {
	existsPredicate = () => false;
	directoryEntries = new Map();
	dynamicBinDirs = new Map();
}

test("finds CLIs installed by supported package managers", () => {
	for (const parts of [
		[".local", "share", "pnpm"],
		[".volta", "bin"],
		[".fnm", "aliases", "default", "bin"],
		[".asdf", "shims"],
		[".proto", "bin"],
	]) {
		const expected = join(HOME, ...parts, "example-cli").replaceAll("\\", "/");
		existsPredicate = (path) => path === expected;
		expect(toolConfigs.cliExists("example-cli")).toBe(true);
	}
});

const VSCODE_VARIANTS = [
	"Code",
	"Code - Insiders",
	"Cursor",
	"Cursor Nightly",
	"VSCodium",
	"Windsurf",
	"Windsurf Next",
	"Trae",
	"Void",
	"Positron",
] as const;

const VSCODE_EXTENSION_TOOLS = [
	{ id: "cline", extensionId: "saoudrizwan.claude-dev" },
	{ id: "roo-code", extensionId: "RooVeterinaryInc.roo-cline" },
] as const;

describe("VS Code fork extension storage detection", () => {
	for (const variant of VSCODE_VARIANTS) {
		test(`detects extension-backed tools in ${variant}`, () => {
			for (const tool of VSCODE_EXTENSION_TOOLS) {
				existsPredicate = (path) =>
					path.endsWith(`/${variant}/User/globalStorage/${tool.extensionId}`);
				toolConfigs.clearInstallCache();

				const config = toolConfigs.TOOL_CONFIGS.find(({ id }) => id === tool.id);
				expect(config).toBeDefined();
				expect(config?.isInstalled()).toBe(true);
			}
		});
	}
});

const STATIC_PACKAGE_MANAGER_PATHS = [
	{ manager: "Bun", parts: [".bun", "bin"] },
	{ manager: "mise shims", parts: [".local", "share", "mise", "shims"] },
	{ manager: "pnpm", parts: [".local", "share", "pnpm"] },
	{ manager: "Volta", parts: [".volta", "bin"] },
	{ manager: "Yarn classic", parts: [".yarn", "bin"] },
	{ manager: "Yarn global", parts: [".config", "yarn", "global", "node_modules", ".bin"] },
	{ manager: "fnm", parts: [".fnm", "aliases", "default", "bin"] },
	{ manager: "asdf", parts: [".asdf", "shims"] },
	{ manager: "proto", parts: [".proto", "bin"] },
] as const;

describe("findSkillkitBin package-manager discovery", () => {
	for (const { manager, parts } of STATIC_PACKAGE_MANAGER_PATHS) {
		test(`finds skillkit installed via ${manager}`, () => {
			resetDiscovery();
			const expected = normalize(join(HOME, ...parts, "skillkit"));
			existsPredicate = (path) => path === expected;

			expect(skillkit.findSkillkitBin()).toBe(expected);
		});
	}

	test("keeps a case for every static package-manager directory", () => {
		const expectedDirs = STATIC_PACKAGE_MANAGER_PATHS.map(({ parts }) =>
			normalize(join(HOME, ...parts)),
		);

		expect(skillkit.getPackageManagerBinDirs(HOME).map(normalize)).toEqual(expectedDirs);
	});

	for (const { manager, baseParts, version } of [
		{ manager: "NVM", baseParts: [".nvm", "versions", "node"], version: "v22.0.0" },
		{ manager: "mise Node", baseParts: [".local", "share", "mise", "installs", "node"], version: "22.0.0" },
		{ manager: "mise Bun", baseParts: [".local", "share", "mise", "installs", "bun"], version: "1.2.0" },
	] as const) {
		test(`finds skillkit installed via ${manager} version directories`, () => {
			resetDiscovery();
			const baseDir = normalize(join(HOME, ...baseParts));
			const expected = normalize(join(baseDir, version, "bin", "skillkit"));
			directoryEntries.set(baseDir, [version]);
			existsPredicate = (path) => path === expected;

			expect(skillkit.findSkillkitBin()).toBe(expected);
		});
	}

	for (const { manager, command } of [
		{ manager: "pnpm", command: "pnpm bin -g" },
		{ manager: "Yarn", command: "yarn global bin" },
		{ manager: "npm", command: "npm bin -g" },
	] as const) {
		test(`finds skillkit via the ${manager} dynamic fallback`, () => {
			resetDiscovery();
			const binDir = normalize(join(HOME, "dynamic", manager.toLowerCase()));
			const expected = normalize(join(binDir, "skillkit"));
			dynamicBinDirs.set(command, binDir);
			existsPredicate = (path) => path === expected;

			expect(skillkit.findSkillkitBin()).toBe(expected);
		});
	}
});
