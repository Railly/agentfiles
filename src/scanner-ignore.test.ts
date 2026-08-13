import { describe, expect, test } from "bun:test";
import { isScannableMarkdownFile } from "./scanner-ignore";

describe("scanner metadata files", () => {
	test("excludes common package metadata case-insensitively", () => {
		const metadata = [
			"HISTORY.md",
			"changes.md",
			"AUTHORS",
			"notice",
			".gitignore",
			".gitkeep",
		];

		const scanResults = [...metadata, "my-skill.md"].filter(isScannableMarkdownFile);

		expect(scanResults).toEqual(["my-skill.md"]);
	});
});
