import { describe, expect, test } from "bun:test";
import { isSafeMarketplaceSource, isSafeSkillName, resolveContainedSkillPath } from "./command-safety";

describe("command safety", () => {
	test("accepts supported skill names and repository sources", () => {
		expect(isSafeSkillName("my-skill_2.0")).toBe(true);
		expect(isSafeSkillName("Diseño de prompts")).toBe(true);
		expect(isSafeMarketplaceSource("owner/repo-name.js")).toBe(true);
	});

	test("rejects shell metacharacters and traversal", () => {
		for (const value of ["skill && command", "$(command)", "../outside", "name/child"])
			expect(isSafeSkillName(value)).toBe(false);

		for (const value of ["owner/repo;command", "../repo", "owner/repo/extra"])
			expect(isSafeMarketplaceSource(value)).toBe(false);

	});

	test("keeps cleanup paths inside their configured root", () => {
		expect(resolveContainedSkillPath("/home/user/.agents/skills", "safe-name"))
			.toBe("/home/user/.agents/skills/safe-name");
		expect(resolveContainedSkillPath("/home/user/.agents/skills", "../../outside"))
			.toBeNull();
	});
});
