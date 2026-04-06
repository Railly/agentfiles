import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
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
			},
		},
		rules: {
			"import/no-extraneous-dependencies": ["error", {
				devDependencies: true,
				peerDependencies: true,
				optionalDependencies: false,
			}],
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-return": "off",
			"@typescript-eslint/no-base-to-string": "off",
		},
	},
	{
		ignores: ["main.js", "node_modules/**", "*.mjs"],
	},
]);
