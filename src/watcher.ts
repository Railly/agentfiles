import { watch, type FSWatcher } from "fs";

export class SkillWatcher {
	private watchers: FSWatcher[] = [];
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private debounceMs: number;
	private onChange: () => void;

	constructor(debounceMs: number, onChange: () => void) {
		this.debounceMs = debounceMs;
		this.onChange = onChange;
	}

	watchPaths(paths: string[]): void {
		this.close();
		for (const p of paths) {
			try {
				const w = watch(p, { recursive: true }, () => this.scheduleUpdate());
				this.watchers.push(w);
			} catch { /* empty */ }
		}
	}

	private scheduleUpdate(): void {
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.onChange();
		}, this.debounceMs);
	}

	close(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
		for (const w of this.watchers) {
			try {
				w.close();
			} catch { /* empty */ }
		}
		this.watchers = [];
	}
}
