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

## Skillkit dashboard

Agentfiles includes a built-in analytics dashboard powered by [skillkit](https://www.npmjs.com/package/@crafter/skillkit). Click **Dashboard** in the sidebar to see:

- **Overview** — Total invocations, active skills, installed count, stale count
- **Top skills** — Bar chart of your most-used skills over the last 30 days
- **Health** — Donut chart of active vs unused skills, metadata budget usage
- **Burn rate** — Daily cost chart, model breakdown, session count, API calls
- **Context tax** — Stacked bar showing how CLAUDE.md, skills metadata, and memory split your context window, with per-session cost estimates and cache savings
- **Stale skills** — List of skills never triggered in 30 days with `skillkit prune` hint

Usage badges also appear on individual skill cards:

- Use count (blue badge)
- **STALE** (red) — not triggered in 30+ days
- **HEAVY** (yellow) — content exceeds 5k characters

Install skillkit to enable:

```bash
npm i -g @crafter/skillkit && skillkit scan
```

Without skillkit, the plugin works normally for browsing and editing — the dashboard and badges are optional.

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

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Railly/agentfiles/releases)
2. Create `.obsidian/plugins/agentfiles/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in Settings > Community plugins

## Usage

1. Click the CPU icon in the ribbon, or run **Agentfiles: Open** from the command palette
2. Browse skills by tool or type in the sidebar
3. Click any skill to preview its content
4. Click the pencil icon to edit, Cmd+S to save
5. Click **Dashboard** for analytics (requires skillkit)

## Desktop only

This plugin requires desktop Obsidian (macOS, Windows, Linux) because it reads files outside your vault.

## License

MIT
