import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

const releases = [
	{
		version: "0.7.4",
		date: "2026-05-12",
		tag: "latest",
		changes: [
			{
				type: "feat",
				text: "GitHub Actions release workflow with build provenance attestation",
			},
			{
				type: "fix",
				text: "Switch timer functions from activeWindow.setTimeout to window.setTimeout per Obsidian guidelines",
			},
			{
				type: "fix",
				text: "Replace globalThis with window.require in electron shell helper",
			},
			{
				type: "fix",
				text: "Rename options.global to options.globalInstall to avoid linter false positive",
			},
			{
				type: "fix",
				text: "Remove all !important rules and duplicate CSS selectors",
			},
			{
				type: "chore",
				text: "Exclude web/ landing source from plugin scan",
			},
		],
	},
	{
		version: "0.7.3",
		date: "2026-05-12",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Now listed on the Obsidian Community directory — install with one click",
			},
			{
				type: "fix",
				text: "Bumped minAppVersion to 1.7.2 to match Workspace.revealLeaf",
			},
			{
				type: "fix",
				text: "Popout window compatibility (activeWindow / activeDocument across watcher, modals, editor)",
			},
			{
				type: "fix",
				text: "Typed every JSON.parse and GitHub / skills.sh API response",
			},
			{
				type: "fix",
				text: "Replaced document.createElementNS with createSvg in sparkline and tool icons",
			},
			{
				type: "fix",
				text: "Removed direct electron shell import — typed through utils/shell helper",
			},
		],
	},
	{
		version: "0.7.0",
		date: "2026-04-01",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "CodeMirror 6 editor with full syntax highlighting and YAML linter",
			},
			{
				type: "feat",
				text: "Foldable frontmatter blocks in the skill editor",
			},
			{
				type: "feat",
				text: "Inline YAML error markers for invalid frontmatter",
			},
			{
				type: "feat",
				text: "Cmd+S / Ctrl+S keyboard shortcut to save skills",
			},
			{
				type: "fix",
				text: "Editor state not resetting when switching between skills",
			},
		],
	},
	{
		version: "0.6.0",
		date: "2026-02-15",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Conversations view for browsing Claude Code session transcripts",
			},
			{
				type: "feat",
				text: "Session search across all conversation history",
			},
			{
				type: "feat",
				text: "Export conversation to vault as a permanent note",
			},
			{
				type: "feat",
				text: "Tag sessions for later reference",
			},
		],
	},
	{
		version: "0.4.3",
		date: "2026-01-20",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Dashboard view with burn rate and context tax metrics",
			},
			{
				type: "feat",
				text: "skillkit CLI integration for usage analytics",
			},
			{
				type: "feat",
				text: "Sparkline charts for per-skill health metrics",
			},
			{
				type: "fix",
				text: "Watcher not detecting files added outside Obsidian",
			},
		],
	},
	{
		version: "0.3.0",
		date: "2025-12-10",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Marketplace tab connected to skills.sh",
			},
			{
				type: "feat",
				text: "One-click install from community skills registry",
			},
			{
				type: "feat",
				text: "Tool directory selector when installing marketplace skills",
			},
		],
	},
	{
		version: "0.2.1",
		date: "2025-11-28",
		tag: null,
		changes: [
			{
				type: "fix",
				text: "Scanner missing agent files in nested directories",
			},
			{
				type: "fix",
				text: "File watcher throwing errors on macOS Sequoia",
			},
		],
	},
	{
		version: "0.2.0",
		date: "2025-11-15",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Create new skills with stepped wizard (pick tool, type, name)",
			},
			{
				type: "feat",
				text: "Inline skill editor with Markdown preview",
			},
			{
				type: "feat",
				text: "File watcher for real-time panel updates",
			},
			{
				type: "feat",
				text: "Support for Copilot, Amp, and OpenCode skill directories",
			},
		],
	},
	{
		version: "0.1.0",
		date: "2025-10-30",
		tag: null,
		changes: [
			{
				type: "feat",
				text: "Initial release: skill scanner for Claude Code, Cursor, Codex, Windsurf",
			},
			{
				type: "feat",
				text: "Unified list view with tool and type filters",
			},
			{
				type: "feat",
				text: "Deep search toggle to search inside file content",
			},
		],
	},
];

const typeStyles: Record<string, string> = {
	feat: "text-violet-400 bg-violet-950/50 border-violet-900/50",
	fix: "text-emerald-400 bg-emerald-950/50 border-emerald-900/50",
	chore: "text-zinc-400 bg-zinc-900/50 border-zinc-700/50",
};

export default function ChangelogPage() {
	return (
		<>
			<Nav />
			<main className="pt-14 flex-1">
				<div className="max-w-2xl mx-auto px-6 py-16">
					<div className="mb-12">
						<h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
						<p className="text-[var(--muted)] mt-2 text-sm">
							Every release, every change.
						</p>
					</div>

					<div className="relative">
						<div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--border)]" />
						<div className="space-y-12 pl-8">
							{releases.map((release) => (
								<div key={release.version} className="relative">
									<div className="absolute -left-[2.125rem] top-1 size-3 rounded-full border-2 border-[var(--accent)] bg-[var(--background)]" />
									<div className="flex items-baseline gap-3 mb-4">
										<h2 className="font-mono font-bold text-lg text-[var(--foreground)]">
											v{release.version}
										</h2>
										{release.tag && (
											<span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/50 border border-violet-900/50 text-violet-400 font-mono">
												{release.tag}
											</span>
										)}
										<span className="text-xs text-[var(--muted)] font-mono ml-auto">
											{release.date}
										</span>
									</div>
									<ul className="space-y-2">
										{release.changes.map((change) => (
											<li key={change.text} className="flex items-start gap-3">
												<span
													className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${typeStyles[change.type] ?? typeStyles.chore}`}
												>
													{change.type}
												</span>
												<span className="text-sm text-[var(--muted)]">
													{change.text}
												</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>

					<div className="mt-16 pt-8 border-t border-[var(--border)]">
						<p className="text-xs text-[var(--muted)]">
							For the full history, see the{" "}
							<a
								href="https://github.com/Railly/agentfiles/releases"
								target="_blank"
								rel="noreferrer"
								className="text-violet-400 hover:text-violet-300 transition-colors"
							>
								GitHub releases
							</a>
							.
						</p>
					</div>
				</div>
			</main>
			<Footer />
		</>
	);
}
