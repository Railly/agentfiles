import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

const sections = [
	{
		id: "getting-started",
		title: "Getting Started",
		items: [
			{ id: "installation", label: "Installation" },
			{ id: "quick-start", label: "Quick Start" },
			{ id: "requirements", label: "Requirements" },
		],
	},
	{
		id: "features",
		title: "Features",
		items: [
			{ id: "scanner", label: "Skill Scanner" },
			{ id: "editor", label: "CM6 Editor" },
			{ id: "marketplace", label: "Marketplace" },
			{ id: "watcher", label: "File Watcher" },
			{ id: "conversations", label: "Conversations" },
			{ id: "dashboard", label: "Dashboard" },
		],
	},
	{
		id: "reference",
		title: "Reference",
		items: [
			{ id: "skill-spec", label: "Skill Format" },
			{ id: "supported-tools", label: "Supported Tools" },
			{ id: "configuration", label: "Configuration" },
			{ id: "skillkit", label: "skillkit CLI" },
		],
	},
];

export default function DocsPage() {
	return (
		<>
			<Nav />
			<div className="pt-14 flex min-h-screen">
				<Sidebar />
				<main className="flex-1 min-w-0">
					<div className="max-w-3xl mx-auto px-6 py-12">
						<InstallationSection />
						<QuickStartSection />
						<RequirementsSection />
						<ScannerSection />
						<EditorSection />
						<MarketplaceSection />
						<WatcherSection />
						<ConversationsSection />
						<DashboardSection />
						<SkillSpecSection />
						<SupportedToolsSection />
						<ConfigurationSection />
						<SkillkitSection />
					</div>
				</main>
			</div>
			<Footer />
		</>
	);
}

function Sidebar() {
	return (
		<aside className="hidden lg:block w-56 shrink-0 border-r border-[var(--border)] sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
			<div className="p-5 space-y-6">
				{sections.map((section) => (
					<div key={section.id}>
						<p className="text-xs font-mono text-[var(--muted)] uppercase tracking-widest mb-3">
							{section.title}
						</p>
						<ul className="space-y-1">
							{section.items.map((item) => (
								<li key={item.id}>
									<a
										href={`#${item.id}`}
										className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors block py-0.5"
									>
										{item.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</aside>
	);
}

function DocSection({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section id={id} className="mb-16 scroll-mt-20">
			<h2 className="text-xl font-bold tracking-tight mb-4 pb-3 border-b border-[var(--border)]">
				{title}
			</h2>
			<div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
				{children}
			</div>
		</section>
	);
}

function Code({ children }: { children: string }) {
	return (
		<code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-violet-300">
			{children}
		</code>
	);
}

function CodeBlock({
	children,
	lang = "",
}: {
	children: string;
	lang?: string;
}) {
	return (
		<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden my-4">
			{lang && (
				<div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--background)]">
					<span className="font-mono text-xs text-[var(--muted)]">{lang}</span>
				</div>
			)}
			<pre className="p-4 overflow-x-auto">
				<code className="font-mono text-xs text-[var(--foreground)] leading-relaxed">
					{children}
				</code>
			</pre>
		</div>
	);
}

function InstallationSection() {
	return (
		<DocSection id="installation" title="Installation">
			<p className="text-[var(--foreground)]">
				Agentfiles is listed on the{" "}
				<a
					href="https://community.obsidian.md/plugins/agentfiles"
					target="_blank"
					rel="noreferrer"
					className="text-violet-400 hover:text-violet-300 transition-colors"
				>
					Obsidian Community
				</a>{" "}
				directory.
			</p>
			<p className="font-semibold text-[var(--foreground)]">
				One-click via deep link
			</p>
			<p>
				Open this link in your browser:{" "}
				<a
					href="obsidian://show-plugin?id=agentfiles"
					className="text-violet-400 hover:text-violet-300 transition-colors"
				>
					obsidian://show-plugin?id=agentfiles
				</a>
			</p>
			<p>
				It opens Obsidian directly on the install modal. Prefer to see the
				scorecard first?{" "}
				<a
					href="https://community.obsidian.md/plugins/agentfiles"
					target="_blank"
					rel="noreferrer"
					className="text-violet-400 hover:text-violet-300 transition-colors"
				>
					View on Obsidian Community
				</a>
				.
			</p>
			<p className="font-semibold text-[var(--foreground)]">Inside Obsidian</p>
			<div className="space-y-3">
				<div className="flex gap-3">
					<span className="font-mono text-xs text-violet-400 shrink-0 mt-0.5">
						01
					</span>
					<p>
						Go to{" "}
						<strong className="text-[var(--foreground)]">
							Settings &rarr; Community plugins
						</strong>{" "}
						and click{" "}
						<strong className="text-[var(--foreground)]">Browse</strong>
					</p>
				</div>
				<div className="flex gap-3">
					<span className="font-mono text-xs text-violet-400 shrink-0 mt-0.5">
						02
					</span>
					<p>
						Search for <Code>Agentfiles</Code>
					</p>
				</div>
				<div className="flex gap-3">
					<span className="font-mono text-xs text-violet-400 shrink-0 mt-0.5">
						03
					</span>
					<p>
						Click <strong className="text-[var(--foreground)]">Install</strong>{" "}
						then <strong className="text-[var(--foreground)]">Enable</strong>
					</p>
				</div>
			</div>
			<p className="font-semibold text-[var(--foreground)]">Manual install</p>
			<CodeBlock lang="bash">{`# Download latest release assets
curl -L https://github.com/Railly/agentfiles/releases/latest/download/main.js \\
  -o ~/.obsidian/plugins/agentfiles/main.js
curl -L https://github.com/Railly/agentfiles/releases/latest/download/manifest.json \\
  -o ~/.obsidian/plugins/agentfiles/manifest.json
curl -L https://github.com/Railly/agentfiles/releases/latest/download/styles.css \\
  -o ~/.obsidian/plugins/agentfiles/styles.css`}</CodeBlock>
		</DocSection>
	);
}

function QuickStartSection() {
	return (
		<DocSection id="quick-start" title="Quick Start">
			<p className="text-[var(--foreground)]">
				Once installed, open the Agentfiles panel from the left sidebar ribbon
				or via the command palette.
			</p>
			<p>
				The scanner will automatically discover all skills, commands, and agents
				from supported tools on your system. No configuration required for the
				default paths.
			</p>
			<CodeBlock lang="bash">{`# Skills are discovered from paths like:
~/.claude/skills/       # Claude Code skills
~/.claude/commands/     # Claude Code commands
~/.claude/agents/       # Claude Code agents
~/.cursor/skills/       # Cursor skills
~/.codex/skills/        # Codex skills
~/.codeium/windsurf/memories/  # Windsurf memories`}</CodeBlock>
			<p>
				Use the search bar to filter by name or toggle{" "}
				<strong className="text-[var(--foreground)]">Deep Search</strong> to
				search inside file content.
			</p>
		</DocSection>
	);
}

function RequirementsSection() {
	return (
		<DocSection id="requirements" title="Requirements">
			<ul className="space-y-2">
				<li>
					<strong className="text-[var(--foreground)]">Obsidian</strong> v1.4.11
					or later
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Desktop only</strong>{" "}
					&mdash; macOS, Windows, or Linux (reads files outside your vault)
				</li>
				<li>
					<strong className="text-[var(--foreground)]">skillkit</strong>{" "}
					(optional) &mdash; required for Dashboard analytics
				</li>
			</ul>
		</DocSection>
	);
}

function ScannerSection() {
	return (
		<DocSection id="scanner" title="Skill Scanner">
			<p className="text-[var(--foreground)]">
				The scanner reads your filesystem for skill files across all configured
				tool directories. It runs on startup and whenever the file watcher
				detects changes.
			</p>
			<p>
				Each skill is parsed for its YAML frontmatter (name, description, tool,
				type) and displayed in the unified list. Skills without frontmatter are
				still shown using their filename as the label.
			</p>
			<p>
				You can filter by tool, type (skill / command / agent), or search by
				name and content.
			</p>
		</DocSection>
	);
}

function EditorSection() {
	return (
		<DocSection id="editor" title="CodeMirror 6 Editor">
			<p className="text-[var(--foreground)]">
				Clicking any skill opens it in the built-in CM6 editor. The editor
				provides:
			</p>
			<ul className="space-y-2">
				<li>
					<strong className="text-[var(--foreground)]">
						Syntax highlighting
					</strong>{" "}
					for Markdown and YAML frontmatter
				</li>
				<li>
					<strong className="text-[var(--foreground)]">YAML linter</strong> with
					inline error markers for invalid frontmatter
				</li>
				<li>
					<strong className="text-[var(--foreground)]">
						Foldable frontmatter
					</strong>{" "}
					&mdash; collapse the <Code>---</Code> block to focus on content
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Cmd+S / Ctrl+S</strong>{" "}
					to save changes directly to disk
				</li>
			</ul>
			<p>
				The editor writes directly to the skill file on disk. Changes are
				reflected immediately in the panel.
			</p>
		</DocSection>
	);
}

function MarketplaceSection() {
	return (
		<DocSection id="marketplace" title="Marketplace">
			<p className="text-[var(--foreground)]">
				The Marketplace tab connects to{" "}
				<a
					href="https://skills.sh"
					target="_blank"
					rel="noreferrer"
					className="text-violet-400 hover:text-violet-300 transition-colors"
				>
					skills.sh
				</a>{" "}
				to browse community-contributed skills.
			</p>
			<p>
				When you click{" "}
				<strong className="text-[var(--foreground)]">Install</strong> on a
				skill, you choose which tool directory to install it into. The file is
				written directly to the correct path.
			</p>
		</DocSection>
	);
}

function WatcherSection() {
	return (
		<DocSection id="watcher" title="File Watcher">
			<p className="text-[var(--foreground)]">
				Agentfiles watches all configured skill directories for changes using
				the native filesystem events API. When a skill file is added, modified,
				or deleted externally (e.g., by a CLI tool), the panel updates
				automatically.
			</p>
			<p>
				The watcher starts when the plugin loads and stops when Obsidian closes.
				No manual refresh needed.
			</p>
		</DocSection>
	);
}

function ConversationsSection() {
	return (
		<DocSection id="conversations" title="Conversations">
			<p className="text-[var(--foreground)]">
				The Conversations view reads Claude Code session transcripts from{" "}
				<Code>~/.claude/projects/</Code> and presents them as a searchable list.
			</p>
			<ul className="space-y-2">
				<li>
					<strong className="text-[var(--foreground)]">Search</strong> across
					all session content
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Tag</strong> sessions for
					later reference
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Export</strong> a session
					as a permanent note in your vault
				</li>
			</ul>
			<p>
				Transcripts are parsed from the JSONL format Claude Code uses to store
				conversation history.
			</p>
		</DocSection>
	);
}

function DashboardSection() {
	return (
		<DocSection id="dashboard" title="Dashboard">
			<p className="text-[var(--foreground)]">
				The Dashboard requires the{" "}
				<a
					href="https://www.npmjs.com/package/@crafter/skillkit"
					target="_blank"
					rel="noreferrer"
					className="text-violet-400 hover:text-violet-300 transition-colors"
				>
					skillkit
				</a>{" "}
				CLI to be installed and to have run at least one scan.
			</p>
			<CodeBlock lang="bash">{`npm i -g @crafter/skillkit
skillkit scan`}</CodeBlock>
			<p>
				Once data is available, the Dashboard shows burn rate (tokens/day),
				context tax (% of context used by skills), and health metrics per skill.
			</p>
		</DocSection>
	);
}

function SkillSpecSection() {
	return (
		<DocSection id="skill-spec" title="Skill Format">
			<p className="text-[var(--foreground)]">
				Skills are plain Markdown files with optional YAML frontmatter. The
				frontmatter is used by Agentfiles for display and filtering.
			</p>
			<CodeBlock lang="markdown">{`---
name: ship
description: Commit staged changes with a conventional commit message
tool: claude
type: skill
version: 1.0.0
---

When asked to ship or commit:

1. Run \`git status\` to see staged files
2. Analyze the diff with \`git diff --staged\`
3. Write a conventional commit message (feat/fix/chore/docs/refactor)
4. Run \`git commit -m "..."\`

Follow the project's existing commit style. Never skip hooks.`}</CodeBlock>
			<p>Supported frontmatter fields:</p>
			<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
				<table className="w-full text-xs font-mono">
					<thead>
						<tr className="border-b border-[var(--border)] bg-[var(--background)]">
							<th className="text-left px-4 py-2 text-[var(--muted)]">Field</th>
							<th className="text-left px-4 py-2 text-[var(--muted)]">Type</th>
							<th className="text-left px-4 py-2 text-[var(--muted)]">
								Required
							</th>
						</tr>
					</thead>
					<tbody>
						{[
							["name", "string", "No"],
							["description", "string", "No"],
							["tool", "string", "No"],
							["type", "skill | command | agent", "No"],
							["version", "string", "No"],
						].map(([field, type, required]) => (
							<tr
								key={field}
								className="border-b border-[var(--border)] last:border-0"
							>
								<td className="px-4 py-2 text-violet-300">{field}</td>
								<td className="px-4 py-2 text-[var(--muted)]">{type}</td>
								<td className="px-4 py-2 text-[var(--muted)]">{required}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p>
				All fields are optional. Skills without frontmatter work fine &mdash;
				Agentfiles uses the filename as the display name.
			</p>
		</DocSection>
	);
}

function SupportedToolsSection() {
	return (
		<DocSection id="supported-tools" title="Supported Tools">
			<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
				<table className="w-full text-xs font-mono">
					<thead>
						<tr className="border-b border-[var(--border)] bg-[var(--background)]">
							<th className="text-left px-4 py-2 text-[var(--muted)]">Tool</th>
							<th className="text-left px-4 py-2 text-[var(--muted)]">
								Skills
							</th>
							<th className="text-left px-4 py-2 text-[var(--muted)]">
								Commands
							</th>
							<th className="text-left px-4 py-2 text-[var(--muted)]">
								Agents
							</th>
						</tr>
					</thead>
					<tbody>
						{[
							[
								"Claude Code",
								"~/.claude/skills/",
								"~/.claude/commands/",
								"~/.claude/agents/",
							],
							["Cursor", "~/.cursor/skills/", "", "~/.cursor/agents/"],
							[
								"Codex",
								"~/.codex/skills/",
								"~/.codex/prompts/",
								"~/.codex/agents/",
							],
							["Windsurf", "~/.codeium/windsurf/memories/", "", ""],
							["Copilot", "~/.copilot/skills/", "", ""],
							["Amp", "~/.config/amp/skills/", "", ""],
							["OpenCode", "~/.config/opencode/skills/", "", ""],
						].map(([tool, skills, commands, agents]) => (
							<tr
								key={tool}
								className="border-b border-[var(--border)] last:border-0"
							>
								<td className="px-4 py-2 text-[var(--foreground)]">{tool}</td>
								<td className="px-4 py-2 text-violet-300 text-[10px]">
									{skills || "—"}
								</td>
								<td className="px-4 py-2 text-violet-300 text-[10px]">
									{commands || "—"}
								</td>
								<td className="px-4 py-2 text-violet-300 text-[10px]">
									{agents || "—"}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</DocSection>
	);
}

function ConfigurationSection() {
	return (
		<DocSection id="configuration" title="Configuration">
			<p className="text-[var(--foreground)]">
				Open{" "}
				<strong className="text-[var(--foreground)]">
					Settings &rarr; Agentfiles
				</strong>{" "}
				to configure the plugin.
			</p>
			<ul className="space-y-2">
				<li>
					<strong className="text-[var(--foreground)]">File watching</strong>{" "}
					&mdash; automatically detect changes to skill files, with a
					configurable debounce
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Display names</strong>{" "}
					&mdash; how skill and command names appear in the list
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Deep search</strong>{" "}
					&mdash; search file contents by default, with a configurable scope
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Package runner</strong>{" "}
					&mdash; choose <Code>npx</Code> or <Code>bunx</Code> for marketplace
					installs (auto-detect by default)
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Project scanning</strong>{" "}
					&mdash; scan directories under a projects home folder for
					project-level skills
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Custom paths</strong>{" "}
					&mdash; add specific directories to scan beyond the defaults (supports{" "}
					<Code>~</Code> expansion)
				</li>
				<li>
					<strong className="text-[var(--foreground)]">Tools</strong> &mdash;
					enable or disable individual detected tools
				</li>
			</ul>
		</DocSection>
	);
}

function SkillkitSection() {
	return (
		<DocSection id="skillkit" title="skillkit CLI">
			<p className="text-[var(--foreground)]">
				skillkit is a companion CLI that provides analytics data for the
				Dashboard. It is optional and not required for the core skill management
				features.
			</p>
			<CodeBlock lang="bash">{`# Install globally
npm i -g @crafter/skillkit

# Run a scan (generates data for the Dashboard)
skillkit scan

# View usage report
skillkit report`}</CodeBlock>
			<p>
				skillkit reads Claude Code session JSONL files and computes token usage,
				burn rate, and context tax per skill. The data is stored locally and
				never sent to any server.
			</p>
		</DocSection>
	);
}
