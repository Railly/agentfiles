#!/usr/bin/env bun
// Fails if the runtime and display tool rosters diverge, or if README.md tool
// counts drift from TOOL_COUNT. Run in CI on every PR.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOOL_CONFIGS } from "../src/tool-configs";
import { TOOL_COUNT, TOOL_NAMES } from "../src/tools-meta";

const root = join(import.meta.dir, "..");
const readme = readFileSync(join(root, "README.md"), "utf-8");
let failed = false;

// "global-agents" is the shared ~/.agents/skills directory, not a coding tool.
const configuredToolNames = TOOL_CONFIGS.filter(({ id }) => id !== "global-agents").map(
	({ name }) => name,
);
const configuredToolNameSet = new Set<string>(configuredToolNames);
const displayToolNameSet = new Set<string>(TOOL_NAMES);
const missingDisplayNames = configuredToolNames.filter((name) => !displayToolNameSet.has(name));
const staleDisplayNames = TOOL_NAMES.filter((name) => !configuredToolNameSet.has(name));

if (
	configuredToolNames.length !== TOOL_COUNT ||
	missingDisplayNames.length > 0 ||
	staleDisplayNames.length > 0
) {
	console.error(
		`Tool roster drift: tool-configs.ts has ${configuredToolNames.length} coding tools, ` +
			`but tools-meta.ts has ${TOOL_COUNT}.`,
	);
	if (missingDisplayNames.length > 0) {
		console.error(`  Missing from TOOL_NAMES: ${missingDisplayNames.join(", ")}`);
	}
	if (staleDisplayNames.length > 0) {
		console.error(`  Missing from TOOL_CONFIGS: ${staleDisplayNames.join(", ")}`);
	}
	failed = true;
}

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
	failed = true;
}

if (failed) process.exit(1);

console.log(`Runtime and display tool rosters match (${TOOL_COUNT} coding tools).`);
console.log(`README tool counts match TOOL_COUNT (${TOOL_COUNT}).`);
