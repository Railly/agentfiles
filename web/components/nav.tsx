import Link from "next/link";

export function Nav() {
	return (
		<header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
			<div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
				<Link
					href="/"
					className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
				>
					<svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
						<rect width="48" height="48" rx="10" fill="var(--background)" />
						<g transform="translate(8, 8)" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round">
							<path d="M0 6V2a2 2 0 0 1 2-2h4" />
							<path d="M26 0h4a2 2 0 0 1 2 2v4" />
							<path d="M32 26v4a2 2 0 0 1-2 2h-4" />
							<path d="M6 32H2a2 2 0 0 1-2-2v-4" />
							<line x1="6" y1="16" x2="26" y2="16" />
						</g>
					</svg>
					agentfiles
				</Link>
				<nav className="flex items-center gap-6">
					<Link
						href="/docs"
						className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						Docs
					</Link>
					<Link
						href="/changelog"
						className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						Changelog
					</Link>
					<a
						href="https://github.com/Railly/obsidian-agent-skills"
						target="_blank"
						rel="noreferrer"
						className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						GitHub
					</a>
					<a
						href="obsidian://show-plugin?id=agentfiles"
						className="text-sm px-3 py-1.5 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-violet-400 transition-colors"
					>
						Install
					</a>
				</nav>
			</div>
		</header>
	);
}
