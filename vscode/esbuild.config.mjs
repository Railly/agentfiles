import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const production = process.argv[2] === "production";

const obsidianShim = {
	name: "obsidian-shim",
	setup(build) {
		build.onResolve({ filter: /^obsidian$/ }, () => ({
			path: join(here, "src", "obsidian-shim.ts"),
		}));
	},
};

const ctx = await esbuild.context({
	entryPoints: [join(here, "src", "extension.ts")],
	bundle: true,
	external: ["vscode"],
	format: "cjs",
	platform: "node",
	target: "node18",
	outfile: join(here, "dist", "extension.js"),
	plugins: [obsidianShim],
	sourcemap: production ? false : "inline",
	minify: production,
	logLevel: "info",
});

if (production) {
	await ctx.rebuild();
	process.exit(0);
} else {
	await ctx.watch();
}
