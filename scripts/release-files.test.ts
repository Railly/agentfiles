import { describe, expect, test } from "bun:test";
import {
	hasProhibitedReleasePath,
	PROHIBITED_RELEASE_PREFIXES,
	RELEASE_PATHS,
} from "./release-files";

describe("release source tree", () => {
	test("excludes non-plugin applications", () => {
		expect(RELEASE_PATHS).not.toContain("web");
		expect(RELEASE_PATHS).not.toContain("vscode");
		expect(RELEASE_PATHS).not.toContain("scripts");
		expect(PROHIBITED_RELEASE_PREFIXES).toEqual(["scripts/", "web/", "vscode/"]);
	});

	test("detects prohibited tag paths", () => {
		expect(hasProhibitedReleasePath(["src/main.ts", "web/app/page.tsx"])).toBe(true);
		expect(hasProhibitedReleasePath(["scripts/prepare-release-tag.ts"])).toBe(true);
		expect(hasProhibitedReleasePath(["src/main.ts", "README.md"])).toBe(false);
	});
});
