# Agentfiles

Discover, organize, and edit AI agent skills, commands, and agents across Claude Code, Cursor, Codex, Windsurf, and more — from inside Obsidian.

## Features

- **Multi-tool discovery** — Scans 13 tools: Claude Code, Cursor, Windsurf, Codex, Copilot, Amp, OpenCode, Aider, and more
- **Three-column view** — Sidebar filters, skill list with search, and detail panel with markdown preview
- **Built-in editor** — Edit skills in place with Cmd+S save
- **Real-time file watching** — Automatically detects changes to skill files
- **Full-text search** — Search across skill names, descriptions, and content
- **Frontmatter metadata** — View parsed YAML properties at a glance
- **Token estimation** — See character count and estimated token usage per skill
- **Tool logos** — Real SVG logos for each supported coding agent
- **Favorites & collections** — Organize skills your way
- **Symlink deduplication** — Same skill installed in multiple tools shows once

## Supported tools

| Tool | Skills | Commands | Agents |
|------|--------|----------|--------|
| Claude Code | `~/.claude/skills/` | `~/.claude/commands/` | `~/.claude/agents/` |
| Cursor | `~/.cursor/skills/` | | `~/.cursor/agents/` |
| Codex | `~/.codex/skills/` | | `~/.codex/agents/` |
| Windsurf | `~/.codeium/windsurf/memories/` | | |
| Copilot | `~/.copilot/skills/` | | |
| Amp | `~/.config/amp/skills/` | | |
| OpenCode | `~/.config/opencode/skills/` | | |
| Global | `~/.agents/skills/` | | |

## Installation

Search **Agentfiles** in Obsidian's Community plugins browser, or install manually:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Railly/obsidian-agent-skills/releases)
2. Create `~/.obsidian/plugins/agentfiles/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in Settings > Community plugins

## Usage

1. Click the CPU icon in the ribbon, or run **Agentfiles: Open Agentfiles** from the command palette
2. Browse skills by tool or type in the sidebar
3. Click any skill to preview its content
4. Click the pencil icon to edit, Cmd+S to save

## Desktop only

This plugin requires desktop Obsidian (macOS, Windows, Linux) because it reads files outside your vault.

## License

MIT
