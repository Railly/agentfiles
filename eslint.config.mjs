import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import obsidianPlugin from "eslint-plugin-obsidian";

export default [
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			obsidian: obsidianPlugin,
		},
		rules: {
			...obsidianPlugin.rules
				? Object.fromEntries(
						Object.keys(obsidianPlugin.rules).map((r) => [`obsidian/${r}`, "error"])
				  )
				: {},
		},
	},
	{
		ignores: ["main.js", "node_modules/**", "*.mjs"],
	},
];
