#!/usr/bin/env bun
// Next's turbopack root pins the web package, so it cannot import ../../src/tools-meta.
// This copies the source of truth into the web tree before build/dev. The generated file
// is gitignored; src/tools-meta.ts is the only place to edit.

import { join } from "node:path";

const root = join(import.meta.dir, "..", "..");
const src = join(root, "src", "tools-meta.ts");
const dest = join(root, "web", "app", "tools-meta.generated.ts");

const banner =
	"// GENERATED from src/tools-meta.ts by web/scripts/sync-tools-meta.ts. Do not edit.\n";
await Bun.write(dest, banner + (await Bun.file(src).text()));
console.log("Synced tools-meta into web/app/tools-meta.generated.ts");
