import { describe, expect, mock, test } from "bun:test";
import { join } from "path";

const HOME = "/home/agentfiles-test";
let existsPredicate = (_path: string) => false;
const existsSync = mock((path: unknown) =>
	existsPredicate(String(path).replaceAll("\\", "/")),
);

mock.module("os", () => ({
	homedir: () => HOME,
	platform: () => "linux",
}));

mock.module("fs", () => ({
	existsSync,
	readdirSync: () => [],
}));

const toolConfigs = await import("../src/tool-configs");

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
