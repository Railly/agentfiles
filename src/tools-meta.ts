// Single source of truth for the tool roster shown in docs, web copy, and OG metadata.
// The plugin's runtime tool list lives in tool-configs.ts; this file is the display-facing
// mirror that the web package (a separate tsconfig) can also import. TOOL_NAMES must stay
// in sync with the ids in tool-configs.ts. The "Global" ~/.agents/skills entry is a shared
// directory, not a coding tool, so TOOL_COUNT counts it separately.

export const TOOL_NAMES = [
	"Claude Code",
	"Cursor",
	"Codex",
	"Windsurf",
	"Copilot",
	"Amp",
	"OpenCode",
	"Cline",
	"Roo Code",
	"Kilo Code",
	"Continue",
	"OpenHands",
	"Goose",
	"Pi",
	"Antigravity",
	"Claude Desktop",
	"Aider",
] as const;

// Coding tools (excludes the shared global ~/.agents/skills directory).
export const TOOL_COUNT = TOOL_NAMES.length;

// A short lead used across hero copy and README, e.g. "Claude Code, Cursor, Codex, Windsurf, and 17 tools".
export const TOOL_LEAD = "Claude Code, Cursor, Codex, Windsurf";
