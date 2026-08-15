import { expect, mock, test } from "bun:test";
import { homedir } from "os";
import { join } from "path";

const existsSync = mock(() => false);
mock.module("fs", () => ({ existsSync, readdirSync: () => [] }));
const { cliExists } = await import("../src/tool-configs");

test("finds CLIs installed by supported package managers", () => {
	for (const parts of [
		[".local", "share", "pnpm"], [".volta", "bin"],
		[".fnm", "aliases", "default", "bin"], [".asdf", "shims"], [".proto", "bin"],
	]) {
		const expected = join(homedir(), ...parts, "example-cli");
		existsSync.mockImplementation((path) => path === expected);
		expect(cliExists("example-cli")).toBe(true);
	}
});
