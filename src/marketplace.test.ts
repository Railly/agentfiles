import { describe, expect, mock, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const requestedUrls: string[] = [];

void mock.module("obsidian", () => ({
	requestUrl: async ({ url }: { url: string }) => {
		requestedUrls.push(url);
		if (url === "https://api.github.com/repos/owner/repo") {
			return { json: { default_branch: "main" } };
		}
		if (url === "https://api.github.com/repos/owner/repo/commits/main") {
			return { json: { sha: "0123456789abcdef" } };
		}
		if (url === "https://api.github.com/repos/owner/repo/git/trees/0123456789abcdef?recursive=1") {
			return {
				json: {
					tree: [
						{ path: "skills/demo", type: "tree", sha: "folder-sha" },
						{ path: "skills/demo/SKILL.md", type: "blob", sha: "file-sha", size: 12 },
					],
				},
			};
		}
		if (url === "https://raw.githubusercontent.com/owner/repo/0123456789abcdef/skills/demo/SKILL.md") {
			return { text: "# Demo skill" };
		}
		throw new Error(`Unexpected URL: ${url}`);
	},
}));

describe("marketplace GitHub source", () => {
	test("pins previews to a resolved commit SHA", async () => {
		const { fetchSkillContent } = await import("./marketplace");
		const content = await fetchSkillContent("owner/repo", "demo", "owner/repo/demo");
		expect(content).toBe("# Demo skill");
		expect(requestedUrls.at(-1)).toBe(
			"https://raw.githubusercontent.com/owner/repo/0123456789abcdef/skills/demo/SKILL.md",
		);
	});
});

describe("marketplace filesystem transactions", () => {
	test("installs to every root and finalizes cleanly", async () => {
		const { installCopiesTransactional } = await import("./marketplace");
		const fixture = mkdtempSync(join(tmpdir(), "agentfiles-marketplace-test-"));
		try {
			const source = join(fixture, "source");
			const firstRoot = join(fixture, "first");
			const secondRoot = join(fixture, "second");
			mkdirSync(source, { recursive: true });
			writeFileSync(join(source, "SKILL.md"), "new");

			const transaction = installCopiesTransactional(source, [firstRoot, secondRoot], "demo");
			transaction.finalize();

			expect(readFileSync(join(firstRoot, "demo", "SKILL.md"), "utf-8")).toBe("new");
			expect(readFileSync(join(secondRoot, "demo", "SKILL.md"), "utf-8")).toBe("new");
			expect(readdirSync(firstRoot).some((name) => name.startsWith(".agentfiles-"))).toBe(false);
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});

	test("rollback restores previous copies in every root", async () => {
		const { installCopiesTransactional } = await import("./marketplace");
		const fixture = mkdtempSync(join(tmpdir(), "agentfiles-marketplace-test-"));
		try {
			const source = join(fixture, "source");
			const roots = [join(fixture, "first"), join(fixture, "second")];
			mkdirSync(source, { recursive: true });
			writeFileSync(join(source, "SKILL.md"), "new");
			for (const root of roots) {
				mkdirSync(join(root, "demo"), { recursive: true });
				writeFileSync(join(root, "demo", "SKILL.md"), "old");
			}

			const transaction = installCopiesTransactional(source, roots, "demo");
			transaction.rollback();

			for (const root of roots) {
				expect(readFileSync(join(root, "demo", "SKILL.md"), "utf-8")).toBe("old");
			}
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});

	test("writes lock files atomically", async () => {
		const { writeLockFileAt } = await import("./marketplace");
		const fixture = mkdtempSync(join(tmpdir(), "agentfiles-marketplace-test-"));
		try {
			const lockPath = join(fixture, ".agents", ".skill-lock.json");
			writeLockFileAt(lockPath, { version: 3, skills: { demo: { source: "owner/repo" } } });
			writeLockFileAt(lockPath, { version: 3, skills: { demo: { source: "owner/updated" } } });
			expect(JSON.parse(readFileSync(lockPath, "utf-8"))).toEqual({
				version: 3,
				skills: { demo: { source: "owner/updated" } },
			});
		} finally {
			rmSync(fixture, { recursive: true, force: true });
		}
	});
});
