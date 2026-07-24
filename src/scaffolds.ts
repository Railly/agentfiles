import type { SkillType } from "./types";

// Shared scaffold templates for the create-file flows in both the Obsidian plugin
// and the VS Code extension. Keeping them here prevents the two frontends from
// drifting (they used to hand-roll near-identical strings). The rule scaffold emits
// the .mdc frontmatter Cursor and Continue expect (description, globs, alwaysApply);
// AGENTS.md-style agents read a flat body, so memory/rules on those tools still get a
// usable file.

export interface ScaffoldInput {
	name: string;
	type: SkillType;
	// directory-with-skillmd tools get a SKILL.md body; flat tools get a single file.
	directory: boolean;
}

function skillBody(name: string): string {
	return ["---", `name: ${name}`, 'description: ""', "---", "", `# ${name}`, "", "## Instructions", "", ""].join("\n");
}

function ruleBody(name: string): string {
	return [
		"---",
		`description: ${name}`,
		'globs: ""',
		"alwaysApply: false",
		"---",
		"",
		`# ${name}`,
		"",
	].join("\n");
}

function memoryBody(name: string): string {
	return [`# ${name}`, "", ""].join("\n");
}

function flatBody(name: string): string {
	return ["---", 'description: ""', "---", "", `# ${name}`, ""].join("\n");
}

// The file extension a rule/memory/command file should use for a given tool path.
// Cursor rules are .mdc; everything else is .md.
export function scaffoldExtension(type: SkillType, mdc: boolean): string {
	if (type === "rule" && mdc) return ".mdc";
	return ".md";
}

export function scaffoldContent(input: ScaffoldInput): string {
	if (input.directory) return skillBody(input.name);
	switch (input.type) {
		case "rule":
			return ruleBody(input.name);
		case "memory":
			return memoryBody(input.name);
		default:
			return flatBody(input.name);
	}
}
