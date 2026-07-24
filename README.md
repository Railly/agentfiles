# Agentfiles

AI skills manager for Obsidian. Browse, create, and manage skills across Claude Code, Cursor, Codex, Windsurf, and 17 coding agents.

**[Open in Obsidian →](obsidian://show-plugin?id=agentfiles)** · [View on Obsidian Community](https://community.obsidian.md/plugins/agentfiles) · [Website](https://agentfiles.crafter.run) · [Latest release](https://github.com/Railly/agentfiles/releases/latest)

![Browse skills, commands, and agents across 17 coding assistants](assets/browse.jpeg)

![Dashboard with burn rate, context tax, and health metrics](assets/dashboard.jpeg)

## Install

### From Obsidian (one-click)

Open the deep link in your browser:

```
obsidian://show-plugin?id=agentfiles
```

Or open the community page first to see the scorecard and screenshots: **[community.obsidian.md/plugins/agentfiles](https://community.obsidian.md/plugins/agentfiles)**.

You can also search **Agentfiles** in Settings → Community plugins inside Obsidian.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Railly/agentfiles/releases/latest)
2. Create `<vault>/.obsidian/plugins/agentfiles/`
3. Copy the three files into that folder
4. Enable in Settings → Community plugins

### Optional: skillkit analytics

```bash
npm i -g @crafter/skillkit
skillkit scan
```

## What it does

- **Browse** skills, commands, and agents from 17 tools in one place
- **Search** by name or file content with deep search toggle
- **Create** new skills with a stepped wizard (pick tool, type, name)
- **Edit** skills inline with markdown preview and Cmd+S save
- **Marketplace** — install skills from [skills.sh](https://skills.sh)
- **Conversations** — browse Claude Code session history, search, tag, and export to vault
- **Dashboard** — usage analytics, burn rate, context tax, health metrics (requires [skillkit](https://www.npmjs.com/package/@crafter/skillkit))

## Supported tools

| Tool | Skills | Commands | Rules / Memories | Agents |
|------|--------|----------|-------------------|--------|
| Claude Code | `~/.claude/skills/` | `~/.claude/commands/` | | `~/.claude/agents/` |
| Cursor | `~/.cursor/skills/` | | `~/.cursor/rules/` | `~/.cursor/agents/` |
| Windsurf | `~/.codeium/windsurf/skills/` | | `~/.codeium/windsurf/memories/`, `~/.windsurf/rules/` | |
| Codex | `~/.codex/skills/` | `~/.codex/prompts/` | `~/.codex/memories/` | `~/.codex/agents/` |
| Copilot | `~/.copilot/skills/` | | | |
| Amp | `$XDG_CONFIG/amp/skills/` | | | |
| OpenCode | `$XDG_CONFIG/opencode/skills/` | | | |
| Cline | detection only | | | |
| Roo Code | `~/.roo/skills/` | | | |
| Kilo Code | `~/.kilocode/skills/` | | | |
| Continue | `~/.continue/skills/` | | | |
| OpenHands | `~/.openhands/skills/` | | | |
| Goose | `$XDG_CONFIG/goose/skills/` | | | |
| Pi | `~/.pi/agent/skills/` | | | |
| Antigravity | `~/.gemini/antigravity/skills/` | | | |
| Global | `~/.agents/skills/` | | | |
| Claude Desktop | detection only | | | |
| Aider | detection only | | | |

Desktop only (macOS, Windows, Linux) — reads files outside your vault.

## FAQ

### What is Agentfiles?

An AI skills manager for Obsidian. Browse, create, and manage skills, commands, and agents across 17 coding agents, all from your vault. Full docs: [agentfiles.crafter.run/docs](https://agentfiles.crafter.run/docs).

### What can I do with Agentfiles?

See [What it does](#what-it-does) above. Full feature list and screenshots: [agentfiles.crafter.run/docs](https://agentfiles.crafter.run/docs).

### What tools are supported?

See [Supported tools](#supported-tools) above: 17 tools including Claude Code, Cursor, Codex, Windsurf, Copilot, Amp, OpenCode, Cline, Roo Code, Kilo Code, Continue, OpenHands, Goose, Pi, Antigravity, Claude Desktop, Aider, and a global `~/.agents/skills/` directory.

### How do I install Agentfiles?

See [Install](#install) above.

### What is skillkit analytics?

Optional CLI for the Dashboard's usage metrics (burn rate, context tax, health):

```bash
npm i -g @crafter/skillkit
# or: bun add -g @crafter/skillkit
skillkit scan
```

### Is Agentfiles free and open source?

Yes, MIT licensed. See [LICENSE](LICENSE).

### Where can I get help?

- [Obsidian Community](https://community.obsidian.md/plugins/agentfiles)
- [Website](https://agentfiles.crafter.run)
- [GitHub Issues](https://github.com/Railly/agentfiles/issues)

## License

MIT
