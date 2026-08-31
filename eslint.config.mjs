import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	globalIgnores([
		"main.js",
		"node_modules/**",
		"*.mjs",
		"web/**",
		"vscode/**",
		"assets/**",
	]),
	...obsidianmd.configs.recommended,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: "./tsconfig.json",
			},
			globals: {
				document: "readonly",
				navigator: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				DOMParser: "readonly",
				NodeJS: "readonly",
				process: "readonly",
				Buffer: "readonly",
				createEl: "readonly",
				createSvg: "readonly",
				activeWindow: "readonly",
				activeDocument: "readonly",
				window: "readonly",
			},
		},
	},
]);
