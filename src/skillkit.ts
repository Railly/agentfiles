import {
	loadAgentfilesSnapshot,
	type AgentfilesConflict,
	type AgentfilesSnapshot,
	type AgentfilesTrace,
} from "@crafter/skillkit/agentfiles";
import { isSafeSkillName } from "./command-safety";

const BUILTIN_TOOL_NAMES_PLUGIN = new Set([
	"Read", "Write", "Edit", "MultiEdit", "Bash", "Glob", "Grep",
	"WebSearch", "WebFetch", "TodoRead", "TodoWrite", "Task", "Agent",
	"Skill", "LSP", "NotebookEdit", "AskFollowupQuestion",
	"AttemptCompletion", "SearchReplace", "InsertCodeBlock",
	"ReadImages", "ExecuteCommand", "ListFiles", "SearchFiles",
	"ReadFile", "WriteFile", "ReplaceInFile", "ListCodeDefinitionNames",
	"BrowserAction", "UseMcp", "shell", "shell_command",
	"update_plan", "create_plan", "read_file", "write_file",
	"execute_command", "spawn_agent", "write_stdin",
	"multi_tool_use.parallel",
]);

function isRealSkillName(name: string): boolean {
	if (BUILTIN_TOOL_NAMES_PLUGIN.has(name)) return false;
	if (name.startsWith("mcp__") || name.startsWith("mcp_")) return false;
	return true;
}

function readSnapshot(): AgentfilesSnapshot | null {
	return loadAgentfilesSnapshot();
}

export interface SkillkitStats {
	uses: number;
	lastUsed: string | null;
	daysSinceUsed: number | null;
	isStale: boolean;
	isHeavy: boolean;
}

export interface SkillkitStatsWithDaily extends SkillkitStats {
	daily: { date: string; count: number }[];
}

export function isSkillkitAvailable(): boolean {
	return readSnapshot() !== null;
}

export function getSkillkitSnapshotGeneratedAt(): string | null {
	return readSnapshot()?.generatedAt ?? null;
}

export function runSkillkitJson(args: string[]): unknown {
	const command = args[0];
	if (command !== "stats" && command !== "health" && command !== "burn" && command !== "context") return null;
	return readSnapshot()?.dashboard[command] ?? null;
}

export function runSkillkitJsonAsync(args: string[]): Promise<unknown> {
	return Promise.resolve(runSkillkitJson(args));
}

function statsFromSnapshot(): Map<string, SkillkitStatsWithDaily> {
	const stats = new Map<string, SkillkitStatsWithDaily>();
	const data = runSkillkitJson(["stats"]) as {
		top_skills?: { name: string; total: number; daily: { date: string; count: number }[] }[];
	} | null;
	if (!data?.top_skills) return stats;
	const now = Date.now();
	for (const skill of data.top_skills) {
		if (!isRealSkillName(skill.name)) continue;
		const lastDay = skill.daily.at(-1)?.date ?? null;
		const daysSinceUsed = lastDay
			? Math.floor((now - new Date(lastDay).getTime()) / 86_400_000)
			: null;
		stats.set(skill.name, {
			uses: skill.total,
			lastUsed: lastDay,
			daysSinceUsed,
			isStale: daysSinceUsed !== null && daysSinceUsed > 30,
			isHeavy: false,
			daily: skill.daily,
		});
	}
	return stats;
}

export function getSkillkitStats(): Map<string, SkillkitStats> {
	return statsFromSnapshot();
}

export function getSkillkitStatsWithDaily(): Map<string, SkillkitStatsWithDaily> {
	return statsFromSnapshot();
}

export function getSkillConflicts(): Map<string, AgentfilesConflict[]> {
	const conflicts = new Map<string, AgentfilesConflict[]>();
	const snapshot = readSnapshot();
	if (!snapshot) return conflicts;
	for (const [name, details] of Object.entries(snapshot.skills)) {
		if (details.conflicts.length > 0) conflicts.set(name, details.conflicts);
	}
	return conflicts;
}

export function getSkillTraces(skillName: string): AgentfilesTrace[] {
	if (!isSafeSkillName(skillName)) return [];
	return readSnapshot()?.skills[skillName]?.traces ?? [];
}

export function getSkillWarnings(): { oversized: { name: string; lines: number }[]; longDesc: { name: string; chars: number }[] } {
	const data = runSkillkitJson(["health"]) as {
		warnings?: { oversized?: { name: string; lines: number }[]; long_descriptions?: { name: string; chars: number }[] };
	} | null;
	return {
		oversized: data?.warnings?.oversized ?? [],
		longDesc: data?.warnings?.long_descriptions ?? [],
	};
}

export function getSkillkitStatsWithDailyAsync(): Promise<Map<string, SkillkitStatsWithDaily>> {
	return Promise.resolve(getSkillkitStatsWithDaily());
}

export function getSkillConflictsAsync(): Promise<Map<string, AgentfilesConflict[]>> {
	return Promise.resolve(getSkillConflicts());
}

export function getSkillWarningsAsync(): Promise<{ oversized: { name: string; lines: number }[]; longDesc: { name: string; chars: number }[] }> {
	return Promise.resolve(getSkillWarnings());
}

export function getSkillkitCommand(args: string[] = []): string {
	const safeArgs = args.map((arg) => /^[A-Za-z0-9_./:@+-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`);
	return ["bunx", "@crafter/skillkit@latest", ...safeArgs].join(" ");
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
