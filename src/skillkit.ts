import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HOME = homedir();
const DB_PATH = join(HOME, ".skillkit", "analytics.db");

function buildPath(): string {
	const extra = [
		"/usr/local/bin",
		"/opt/homebrew/bin",
		join(HOME, ".local", "bin"),
		join(HOME, ".bun", "bin"),
	];
	const nvmDir = join(HOME, ".nvm", "versions", "node");
	try {
		for (const d of readdirSync(nvmDir)) {
			extra.push(join(nvmDir, d, "bin"));
		}
	} catch { /* empty */ }
	const miseDir = join(HOME, ".local", "share", "mise", "installs");
	for (const runtime of ["node", "bun"]) {
		try {
			for (const d of readdirSync(join(miseDir, runtime))) {
				extra.push(join(miseDir, runtime, d, "bin"));
			}
		} catch { /* empty */ }
	}
	return [...extra, process.env.PATH || ""].join(":");
}

function findSkillkitBin(): string | null {
	const searchPaths = [
		"/usr/local/bin/skillkit",
		"/opt/homebrew/bin/skillkit",
		join(HOME, ".local", "bin", "skillkit"),
		join(HOME, ".bun", "bin", "skillkit"),
		join(HOME, ".local", "share", "mise", "shims", "skillkit"),
	];
	for (const p of searchPaths) {
		if (existsSync(p)) return p;
	}
	const nvmDir = join(HOME, ".nvm", "versions", "node");
	try {
		for (const d of readdirSync(nvmDir)) {
			const p = join(nvmDir, d, "bin", "skillkit");
			if (existsSync(p)) return p;
		}
	} catch { /* empty */ }
	const miseDir = join(HOME, ".local", "share", "mise", "installs");
	for (const runtime of ["node", "bun"]) {
		try {
			for (const d of readdirSync(join(miseDir, runtime))) {
				const p = join(miseDir, runtime, d, "bin", "skillkit");
				if (existsSync(p)) return p;
			}
		} catch { /* empty */ }
	}
	return null;
}

let _bin: string | null | undefined;
function getSkillkitBin(): string | null {
	if (_bin === undefined) _bin = findSkillkitBin();
	return _bin;
}

export interface SkillkitStats {
	uses: number;
	lastUsed: string | null;
	daysSinceUsed: number | null;
	isStale: boolean;
	isHeavy: boolean;
}

export function isSkillkitAvailable(): boolean {
	return getSkillkitBin() !== null || existsSync(DB_PATH);
}

export function runSkillkitJson(cmd: string): Record<string, unknown> | unknown[] | null {
	const bin = getSkillkitBin();
	if (!bin) return null;
	try {
		const out = execSync(`${bin} ${cmd} --json`, {
			encoding: "utf-8",
			timeout: 15000,
			env: { ...process.env, NO_COLOR: "1", PATH: buildPath() },
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		const jsonStart = out.indexOf("{");
		const jsonStartArr = out.indexOf("[");
		const start = jsonStart === -1 ? jsonStartArr : jsonStartArr === -1 ? jsonStart : Math.min(jsonStart, jsonStartArr);
		if (start === -1) return null;
		return JSON.parse(out.slice(start));
	} catch { /* empty */ return null; }
}

export function getSkillkitStats(): Map<string, SkillkitStats> {
	const stats = new Map<string, SkillkitStats>();
	if (!isSkillkitAvailable()) return stats;

	const data = runSkillkitJson("stats") as {
		top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
	} | null;

	if (!data?.top_skills) return stats;

	const now = Date.now();
	for (const skill of data.top_skills) {
		const lastDay = skill.daily.length > 0
			? skill.daily[skill.daily.length - 1]?.date
			: null;
		let daysSinceUsed: number | null = null;

		if (lastDay) {
			daysSinceUsed = Math.floor((now - new Date(lastDay).getTime()) / (1000 * 60 * 60 * 24));
		}

		stats.set(skill.name, {
			uses: skill.total,
			lastUsed: lastDay || null,
			daysSinceUsed,
			isStale: daysSinceUsed !== null && daysSinceUsed > 30,
			isHeavy: false,
		});
	}

	return stats;
}

export interface SkillkitStatsWithDaily extends SkillkitStats {
	daily: { date: string; count: number }[];
}

export function getSkillkitStatsWithDaily(): Map<string, SkillkitStatsWithDaily> {
	const stats = new Map<string, SkillkitStatsWithDaily>();
	if (!isSkillkitAvailable()) return stats;

	const data = runSkillkitJson("stats") as {
		top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
	} | null;

	if (!data?.top_skills) return stats;

	const now = Date.now();
	for (const skill of data.top_skills) {
		const lastDay = skill.daily.length > 0
			? skill.daily[skill.daily.length - 1]?.date
			: null;
		let daysSinceUsed: number | null = null;
		if (lastDay) {
			daysSinceUsed = Math.floor((now - new Date(lastDay).getTime()) / (1000 * 60 * 60 * 24));
		}

		stats.set(skill.name, {
			uses: skill.total,
			lastUsed: lastDay || null,
			daysSinceUsed,
			isStale: daysSinceUsed !== null && daysSinceUsed > 30,
			isHeavy: false,
			daily: skill.daily,
		});
	}
	return stats;
}

export function getSkillConflicts(): Map<string, { skillName: string; similarity: number }[]> {
	const conflicts = new Map<string, { skillName: string; similarity: number }[]>();
	if (!isSkillkitAvailable()) return conflicts;

	const data = runSkillkitJson("conflicts --dry-run") as {
		pairs?: { skill_a: string; skill_b: string; similarity: number }[];
	} | null;

	if (!data || !("pairs" in data)) return conflicts;

	for (const pair of (data as { pairs: { skill_a: string; skill_b: string; similarity: number }[] }).pairs) {
		if (!conflicts.has(pair.skill_a)) conflicts.set(pair.skill_a, []);
		if (!conflicts.has(pair.skill_b)) conflicts.set(pair.skill_b, []);
		conflicts.get(pair.skill_a)!.push({ skillName: pair.skill_b, similarity: pair.similarity });
		conflicts.get(pair.skill_b)!.push({ skillName: pair.skill_a, similarity: pair.similarity });
	}
	return conflicts;
}

export function getSkillTraces(skillName: string): { traceId: string; timestamp: string; tokens: number; cost: number; duration: number; model: string }[] {
	if (!isSkillkitAvailable()) return [];

	const data = runSkillkitJson(`trace --list --skill ${skillName} --limit 5`) as {
		trace_id: string; timestamp: string; tokens_total: number; cost_estimate: number; duration_ms: number; model: string;
	}[] | null;

	if (!Array.isArray(data)) return [];

	return data.map((t) => ({
		traceId: t.trace_id,
		timestamp: t.timestamp,
		tokens: t.tokens_total,
		cost: t.cost_estimate,
		duration: t.duration_ms,
		model: t.model || "unknown",
	}));
}

export function getSkillWarnings(): { oversized: { name: string; lines: number }[]; longDesc: { name: string; chars: number }[] } {
	if (!isSkillkitAvailable()) return { oversized: [], longDesc: [] };

	const data = runSkillkitJson("health") as {
		warnings?: { oversized: { name: string; lines: number }[]; long_descriptions: { name: string; chars: number }[] };
	} | null;

	if (!data?.warnings) return { oversized: [], longDesc: [] };
	return {
		oversized: data.warnings.oversized || [],
		longDesc: data.warnings.long_descriptions || [],
	};
}

export function runSkillkitAction(cmd: string): { success: boolean; output: string } {
	const bin = getSkillkitBin();
	if (!bin) return { success: false, output: "skillkit not found" };
	try {
		const out = execSync(`${bin} ${cmd}`, {
			encoding: "utf-8",
			timeout: 30000,
			env: { ...process.env, NO_COLOR: "1", PATH: buildPath() },
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		return { success: true, output: out };
	} catch (e: unknown) { /* empty */
		return { success: false, output: e instanceof Error ? e.message : "unknown error" };
	}
}

export function formatLastUsed(lastUsed: string | null): string {
	if (!lastUsed) return "never";
	const ms = Date.now() - new Date(lastUsed).getTime();
	const mins = Math.floor(ms / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}
