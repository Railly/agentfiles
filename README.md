# Agentfiles

Discover, organize, and edit AI agent skills, commands, and agents across Claude Code, Cursor, Codex, Windsurf, and more — from inside Obsidian.

## Features

- **Multi-tool discovery** — Scans 13 tools: Claude Code, Cursor, Windsurf, Codex, Copilot, Amp, OpenCode, Aider, and more
- **Global + project scanning** — Scans user-level agent directories and project-level files (CLAUDE.md, .cursorrules, etc.)
- **Three-column view** — Sidebar filters, skill list with search, and resizable detail panel with markdown preview
- **Resizable panels** — Drag to resize the sidebar and list panels
- **Built-in editor** — Edit skills in place with Cmd+S save
- **Real-time file watching** — Automatically detects changes to skill files
- **Two-tier search** — Quick search on listing fields; toggle deep search to include file contents
- **Frontmatter metadata** — View parsed YAML properties at a glance
- **Token estimation** — See character count and estimated token usage per skill
- **Tool logos** — Real SVG logos for each supported coding agent
- **Scope filters** — Filter by global vs project, or drill into individual projects
- **Favorites & collections** — Organize skills your way
- **Symlink deduplication** — Same skill installed in multiple tools shows once
- **Naming modes** — Auto (frontmatter/heading/filename) or filename-only display

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

### Global paths (user-level)

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

### Project paths (per-repo)

When you add project directories in settings, Agentfiles scans each repo for tool-specific files:

| Tool | Project files |
|------|--------------|
| Claude Code | `.claude/commands/`, `.claude/skills/`, `.claude/agents/`, `CLAUDE.md` (recursive) |
| Cursor | `.cursor/rules/` (`.mdc`), `.cursorrules` |
| Windsurf | `.windsurf/rules/` (`.mdc`), `.windsurfrules` |
| Codex | `codex.md` |
| Copilot | `.github/copilot-instructions.md` |
| Amp | `.amp/rules/` |
| Aider | `.aider.conf.yml` |

- **Auto-discovery** — Point to a parent folder (e.g. `~/projects`) and Agentfiles finds repos inside it by looking for `.git`, `.claude`, `.cursor`, and other marker directories
- **Depth control** — Each path has a configurable scan depth (0 = exact directory, 1–3 = recurse into children)
- **Recursive `CLAUDE.md`** — Claude Code's `CLAUDE.md` files are found at any depth within a project, respecting nested `.git` boundaries as separate project identities
- **Naming** — Project-scoped items show the project name as a badge; display names default to frontmatter/heading/filename but can be set to filename-only in settings

## Installation

Search **Agentfiles** in Obsidian's Community plugins browser, or install manually:

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Railly/agentfiles/releases)
2. Create `.obsidian/plugins/agentfiles/` in your vault
3. Copy the three files into that folder
4. Enable the plugin in Settings > Community plugins

## Usage

1. Click the CPU icon in the ribbon, or run **Agentfiles: Open** from the command palette
2. Browse skills by tool, type, or scope in the sidebar
3. Click any skill to preview its content
4. Click the pencil icon to edit, Cmd+S to save
5. Drag panel edges to resize the sidebar and list columns
6. Toggle the deep search icon to search file contents in addition to listing fields
7. Click **Dashboard** for analytics (requires skillkit)

### Adding project directories

Open Settings > Agentfiles > **Projects** to add folders. You can point to:

- A single project directory (e.g. `~/projects/my-app`)
- A parent directory containing multiple repos (e.g. `~/projects`)

Use the depth dropdown to control how many levels deep Agentfiles searches for projects within each path.

## Desktop only

This plugin requires desktop Obsidian (macOS, Windows, Linux) because it reads files outside your vault.

## License

MIT
