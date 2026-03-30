# Agentfiles

Discover, organize, and edit AI agent skills, commands, and agents across Claude Code, Cursor, Codex, Windsurf, and more — from inside Obsidian.

## Features

### Skill browser
- Multi-tool discovery across 13+ coding agents
- Three-column layout: sidebar filters, skill list, detail panel
- Search by skill name with instant filtering
- Filter by status: stale, heavy, oversized, conflict
- Sort by name or usage count
- Symlink-aware scanning (follows symlinked skill directories)
- Project-level skill scanning (auto-detects vault's `.claude/skills/`)
- Name-based deduplication across tools

### Detail panel
- Markdown preview with syntax-highlighted code blocks
- Built-in editor with Cmd+S save
- Frontmatter metadata display
- File path, size, character count, token estimation
- Warnings: oversized skills (>500 lines), long descriptions (>1024 chars)
- Usage sparkline (30-day daily trend)
- Conflict detection with similarity scores
- Execution traces (last 5 with model, tokens, cost, duration)
- Remove skill button with confirmation dialog

### Marketplace
- Browse and search skills from [skills.sh](https://skills.sh) registry
- Popular skills on first load (cached across sessions)
- Skill content preview with markdown rendering
- Install modal with agent selection (17 agents), scope toggle (project/global), and SVG logos
- Uninstall with lock file and copy cleanup
- Persistent install preferences across sessions
- Configurable package runner (auto/npx/bunx)

### Dashboard (requires [skillkit](https://www.npmjs.com/package/@crafter/skillkit))
- Overview: invocations, active skills, installed count, stale count
- Streaks: current and longest streak with "on fire" badge
- Weekly velocity: cost comparison vs last week with change percentage
- Top skills: bar chart of most-used skills (30 days)
- Health: donut chart of active vs unused, metadata budget bar
- Burn rate: daily cost chart, model breakdown, session and API call counts
- Context tax: stacked bar (CLAUDE.md + skills metadata + memory), per-session cost, cache savings
- Stale skills list
- Action buttons: update skills, scan sessions, prune stale (with confirmation)
- Disk-cached data for instant load on Obsidian restart
- Manual refresh only (no blocking auto-refresh)

### Badges on skill cards
- Use count (blue)
- **STALE** (red) — not triggered in 30+ days
- **HEAVY** (yellow) — content exceeds 5k characters
- **OVERSIZED** (orange) — more than 500 lines
- **CONFLICT** (red) — overlaps with other skills

### Tool logos
Real SVG logos for: Claude Code, Cursor, Windsurf, Codex, GitHub Copilot, OpenCode, Goose, Cline, Continue, Roo Code, Replit, Gemini CLI. Striped placeholder for agents without logos.

## Supported tools

| Tool | Skills | Commands | Agents |
|------|--------|----------|--------|
| Claude Code | `~/.claude/skills/` | `~/.claude/commands/` | `~/.claude/agents/` |
| Cursor | `~/.cursor/skills/` | | `~/.cursor/agents/` |
| Codex | `~/.codex/skills/` | `~/.codex/prompts/` | `~/.codex/agents/` |
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
2. Browse skills by tool, type, or project in the sidebar
3. Click any skill to preview its content and metadata
4. Click the pencil icon to edit, Cmd+S to save
5. Click **Dashboard** for analytics (requires skillkit)
6. Click **Marketplace** to browse and install skills from skills.sh

## Settings

- **File watching** — auto-detect changes to skill files
- **Project scanning** — scan directories for project-level skills
- **Package runner** — choose between auto-detect, npx, or bunx for marketplace installs
- **Tool toggles** — enable/disable individual coding agents

## Desktop only

This plugin requires desktop Obsidian (macOS, Windows, Linux) because it reads files outside your vault.

## License

MIT
