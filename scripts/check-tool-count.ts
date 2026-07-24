#!/usr/bin/env bun
// Fails if README.md tool counts drift from TOOL_COUNT. README cannot import the
// constant, so this greps it and asserts. Run in CI on every PR.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_COUNT } from "../src/tools-meta";

const root = join(import.meta.dir, "..");
const readme = readFileSync(join(root, "README.md"), "utf-8");

// Every standalone "N coding agents", "N tools", "N coding assistants" number in the README.
const pattern = /\b(\d+)\s+(?:coding agents|coding assistants|tools|AI coding tools|coding tools)\b/g;
const bad: string[] = [];
for (const m of readme.matchAll(pattern)) {
	const n = Number(m[1]);
	if (n !== TOOL_COUNT) {
		bad.push(`  "${m[0]}" (expected ${TOOL_COUNT})`);
	}
}

if (bad.length > 0) {
	console.error(`README tool count drift (TOOL_COUNT is ${TOOL_COUNT}):`);
	console.error(bad.join("\n"));
	console.error("\nUpdate README.md, or update TOOL_COUNT in src/tools-meta.ts if a tool was added.");
	process.exit(1);
}

console.log(`README tool counts match TOOL_COUNT (${TOOL_COUNT}).`);
