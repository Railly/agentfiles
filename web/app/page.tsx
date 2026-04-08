import Link from "next/link";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

async function getStarCount(): Promise<number> {
	const doFetch = globalThis.fetch;
	const res = await doFetch(
		"https://api.github.com/repos/Railly/agentfiles",
		{ next: { revalidate: 3600 } },
	);
	if (!res.ok) return 428;
	const data = await res.json();
	return data.stargazers_count ?? 428;
}

async function StarCount() {
	const count = await getStarCount();
	return <>{count}</>;
}

const features = [
	{
		title: "Skill Scanner",
		description:
			"Auto-discovers skills, commands, and agents across Claude Code, Cursor, Codex, Windsurf, Copilot, and 10+ tools from a single unified view.",
		icon: ScanIcon,
	},
	{
		title: "CodeMirror 6 Editor",
		description:
			"Full syntax highlighting, YAML linter with inline errors, foldable frontmatter, and Cmd+S save — built on the same engine as VS Code.",
		icon: EditorIcon,
	},
	{
		title: "Marketplace",
		description:
			"Browse and install community skills from skills.sh directly inside Obsidian. One click to add any skill to your active agent.",
		icon: MarketIcon,
	},
	{
		title: "File Watcher",
		description:
			"Real-time auto-detection of skill file changes on disk. Your panel updates instantly when skills are added or modified externally.",
		icon: WatcherIcon,
	},
	{
		title: "Conversations",
		description:
			"Browse Claude Code session transcripts, search across history, tag sessions, and export them as permanent notes to your vault.",
		icon: ConversationsIcon,
	},
	{
		title: "Dashboard",
		description:
			"Usage analytics, burn rate, context tax, and health metrics. Powered by skillkit — understand how your agents are performing.",
		icon: DashboardIcon,
	},
];

const tools = [
	"Claude Code",
	"Cursor",
	"Codex",
	"Windsurf",
	"Copilot",
	"Amp",
	"OpenCode",
];

export default function HomePage() {
	return (
		<>
			<Nav />
			<main className="flex-1 pt-14">
				<HeroSection />
				<FeaturesSection />
				<ToolsSection />
				<CTASection />
			</main>
			<Footer />
		</>
	);
}

function HeroSection() {
	return (
		<section className="relative overflow-hidden border-b border-[var(--border)]">
			<div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-transparent to-transparent pointer-events-none" />
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none" />
			<GridPattern />
			<div className="relative max-w-5xl mx-auto px-6 py-24 sm:py-36">
				<div className="flex flex-col items-start gap-6 max-w-3xl">
					<div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-mono text-[var(--muted)]">
						<span className="size-1.5 rounded-full bg-violet-400 shrink-0" />
						v0.7.0 &mdash; CodeMirror 6 Editor
					</div>
					<h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
						One plugin for all your
						<br />
						<span className="text-[var(--accent)]">agent files</span>.
					</h1>
					<p className="text-lg text-[var(--muted)] max-w-xl leading-relaxed">
						Browse, create, and edit skills, commands, and agents across Claude
						Code, Cursor, Codex, Windsurf, and 13+ AI coding tools &mdash; from
						a single Obsidian panel.
					</p>
					<div className="flex items-center gap-3 flex-wrap pt-2">
						<a
							href="obsidian://show-plugin?id=agentfiles"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-violet-400 transition-colors"
						>
							Install in Obsidian
						</a>
						<a
							href="https://github.com/Railly/obsidian-agent-skills"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-zinc-500 transition-colors"
						>
							<StarIcon />
							<StarCount /> stars
						</a>
						<Link
							href="/docs"
							className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
						>
							Read the docs &rarr;
						</Link>
					</div>
				</div>

				<div className="mt-16 rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
					<div className="flex items-center gap-1.5 px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]">
						<span className="size-3 rounded-full bg-zinc-700" />
						<span className="size-3 rounded-full bg-zinc-700" />
						<span className="size-3 rounded-full bg-zinc-700" />
						<span className="ml-4 font-mono text-xs text-[var(--muted)]">
							Agentfiles &mdash; Skills
						</span>
					</div>
					<PreviewTerminal />
				</div>
			</div>
		</section>
	);
}

function PreviewTerminal() {
	const skills = [
		{ tool: "claude", name: "ship", path: "~/.claude/skills/ship.md" },
		{ tool: "claude", name: "review", path: "~/.claude/skills/review.md" },
		{ tool: "cursor", name: "refactor", path: "~/.cursor/skills/refactor.md" },
		{ tool: "codex", name: "test-gen", path: "~/.codex/skills/test-gen.md" },
		{
			tool: "windsurf",
			name: "context-prime",
			path: "~/.codeium/windsurf/memories/context-prime.md",
		},
	];

	const toolColors: Record<string, string> = {
		claude: "text-violet-400",
		cursor: "text-blue-400",
		codex: "text-emerald-400",
		windsurf: "text-cyan-400",
	};

	return (
		<div className="p-6 font-mono text-sm space-y-2">
			<div className="flex items-center gap-3 text-xs text-[var(--muted)] mb-4 pb-3 border-b border-[var(--border)]">
				<span>5 skills found</span>
				<span className="text-[var(--border)]">|</span>
				<span>4 tools</span>
				<span className="text-[var(--border)]">|</span>
				<span className="text-violet-400">scanner active</span>
			</div>
			{skills.map((skill) => (
				<div key={skill.path} className="flex items-center gap-3 group">
					<span
						className={`text-xs ${toolColors[skill.tool] ?? "text-zinc-400"} w-16 shrink-0`}
					>
						{skill.tool}
					</span>
					<span className="text-[var(--foreground)] font-medium">
						{skill.name}
					</span>
					<span className="text-[var(--muted)] text-xs ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
						{skill.path}
					</span>
				</div>
			))}
			<div className="pt-3 border-t border-[var(--border)] mt-4">
				<span className="text-xs text-[var(--muted)]">
					<span className="text-violet-400">$</span> watching for changes...
				</span>
			</div>
		</div>
	);
}

function FeaturesSection() {
	return (
		<section className="max-w-5xl mx-auto px-6 py-24">
			<div className="mb-12">
				<h2 className="text-2xl font-bold tracking-tight">
					Everything you need
				</h2>
				<p className="text-[var(--muted)] mt-2">
					One plugin. All your AI agents. No tab switching.
				</p>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{features.map((feature) => {
					const Icon = feature.icon;
					return (
						<div
							key={feature.title}
							className="p-5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-violet-900 transition-colors group"
						>
							<div className="size-8 rounded-lg bg-violet-950/50 border border-violet-900/50 flex items-center justify-center mb-4 text-violet-400 group-hover:bg-violet-950 transition-colors">
								<Icon />
							</div>
							<h3 className="font-semibold text-sm mb-2">{feature.title}</h3>
							<p className="text-xs text-[var(--muted)] leading-relaxed">
								{feature.description}
							</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function ToolsSection() {
	return (
		<section className="border-t border-[var(--border)]">
			<div className="max-w-5xl mx-auto px-6 py-16">
				<p className="text-xs font-mono text-[var(--muted)] mb-8 uppercase tracking-widest">
					Supported agents
				</p>
				<div className="flex flex-wrap gap-3">
					{tools.map((tool) => (
						<span
							key={tool}
							className="px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--muted)] font-mono"
						>
							{tool}
						</span>
					))}
					<span className="px-3 py-1.5 rounded-md border border-dashed border-[var(--border)] text-sm text-[var(--muted)] font-mono">
						+ more
					</span>
				</div>
			</div>
		</section>
	);
}

function CTASection() {
	return (
		<section className="border-t border-[var(--border)]">
			<div className="max-w-5xl mx-auto px-6 py-24 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						Ready to organize your skills?
					</h2>
					<p className="text-[var(--muted)] mt-2 text-sm">
						Free and open source. Install in 30 seconds.
					</p>
				</div>
				<div className="flex items-center gap-3 shrink-0">
					<a
						href="obsidian://show-plugin?id=agentfiles"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium hover:bg-violet-400 transition-colors whitespace-nowrap"
					>
						Install in Obsidian
					</a>
					<Link
						href="/docs"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors whitespace-nowrap"
					>
						View docs
					</Link>
				</div>
			</div>
		</section>
	);
}

function GridPattern() {
	return (
		<svg
			className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<defs>
				<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
					<path
						d="M 32 0 L 0 0 0 32"
						fill="none"
						stroke="white"
						strokeWidth="1"
					/>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
	);
}

function ScanIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M1 4V2a1 1 0 0 1 1-1h2M12 1h2a1 1 0 0 1 1 1v2M15 12v2a1 1 0 0 1-1 1h-2M4 15H2a1 1 0 0 1-1-1v-2M4 8h8"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function EditorIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M10.5 1.5L14.5 5.5M10.5 1.5L2 10l-.5 4 4-.5 8.5-8.5-3.5-3.5zM6.5 4.5l5 5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function MarketIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M2 3h12l-1.5 6H3.5L2 3zM6 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM11 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 1h2"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function WatcherIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
			<path
				d="M1.5 8C3 4.5 5.5 2.5 8 2.5S13 4.5 14.5 8C13 11.5 10.5 13.5 8 13.5S3 11.5 1.5 8z"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

function ConversationsIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M14 9.5a2 2 0 0 1-2 2H5l-3 3V3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6.5z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function DashboardIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect
				x="1.5"
				y="8"
				width="3"
				height="6.5"
				rx="0.5"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<rect
				x="6.5"
				y="5"
				width="3"
				height="9.5"
				rx="0.5"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<rect
				x="11.5"
				y="1.5"
				width="3"
				height="13"
				rx="0.5"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
		</svg>
	);
}

function StarIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M8 1l1.854 4.146L14 5.618l-3 2.927.708 4.455L8 10.5l-3.708 2.5L5 8.545 2 5.618l4.146-.472L8 1z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
