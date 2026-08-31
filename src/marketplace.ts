import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "fs";
import { homedir, tmpdir } from "os";
import { randomUUID } from "crypto";
import { basename, dirname, isAbsolute, join, relative, resolve } from "path";
import { requestUrl } from "obsidian";
import {
	isSafeMarketplaceSource,
	isSafeSkillName,
	resolveContainedSkillPath,
} from "./command-safety";

const HOME = homedir();
const XDG_CONFIG = process.env.XDG_CONFIG_HOME?.trim() || join(HOME, ".config");
const LOCK_PATH = join(HOME, ".agents", ".skill-lock.json");
const API_BASE = "https://skills.sh/api";
const MAX_SKILL_FILES = 200;
const MAX_SKILL_BYTES = 10 * 1024 * 1024;

export interface MarketplaceSkill {
	id: string;
	skillId: string;
	name: string;
	source: string;
	installs: number;
	description?: string;
	content?: string;
	installed?: boolean;
	managed?: boolean;
}

interface SearchApiResponse {
	skills?: Array<{
		id: string;
		skillId: string;
		name: string;
		installs: number;
		source: string;
		description?: string;
	}>;
}

interface GitHubRepoResponse {
	default_branch?: string;
}

interface GitHubCommitResponse {
	sha?: string;
}

interface GitHubTreeEntry {
	path: string;
	type: "blob" | "tree";
	sha: string;
	size?: number;
}

interface GitHubTreeResponse {
	tree?: GitHubTreeEntry[];
	truncated?: boolean;
}

interface RepoTree {
	ref: string;
	entries: GitHubTreeEntry[];
}

interface InstalledSkillMetadata {
	agents: string[];
	globalInstall: boolean;
	installName: string;
	paths: string[];
	projectRoot?: string;
	skillId: string;
}

interface SkillLockEntry {
	source?: string;
	sourceType?: string;
	sourceUrl?: string;
	ref?: string;
	skillPath?: string;
	skillFolderHash?: string;
	installedAt?: string;
	updatedAt?: string;
	agentfiles?: InstalledSkillMetadata;
}

interface SkillLockFile {
	version?: number;
	skills?: Record<string, SkillLockEntry>;
	dismissed?: Record<string, boolean>;
	lastSelectedAgents?: string[];
}

interface InstallCopyTransaction {
	paths: string[];
	finalize(): void;
	rollback(): void;
}

export function cleanupPathBestEffort(
	path: string,
	remove: typeof rmSync = rmSync,
): boolean {
	try {
		remove(path, { recursive: true, force: true });
		return true;
	} catch {
		return false;
	}
}

interface SkillDescriptor {
	ref: string;
	entry: GitHubTreeEntry;
	directory: string;
	installName: string;
	files: GitHubTreeEntry[];
	folderHash: string;
}

const treeCache = new Map<string, RepoTree>();

export async function searchSkills(query: string, projectRoot?: string): Promise<MarketplaceSkill[]> {
	if (query.length < 2) return [];
	try {
		const res = await requestUrl({
			url: `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=30`,
		});
		const data = res.json as SearchApiResponse;
		if (!data.skills) return [];
		const installed = getInstalledStatus(projectRoot);
		return data.skills
			.filter((skill) =>
				isSafeMarketplaceSource(skill.source) && isSafeSkillName(skill.name)
			)
			.map((skill) => ({
				...skill,
				installed: installed.has(skill.name),
				managed: installed.get(skill.name) ?? false,
			}));
	} catch {
		return [];
	}
}

async function getRepoTree(source: string): Promise<RepoTree> {
	if (!isSafeMarketplaceSource(source)) throw new Error("Invalid marketplace source");
	const cached = treeCache.get(source);
	if (cached) return cached;

	const repoRes = await requestUrl({ url: `https://api.github.com/repos/${source}` });
	const repoJson = repoRes.json as GitHubRepoResponse;
	const branch = repoJson.default_branch || "main";
	const commitRes = await requestUrl({
		url: `https://api.github.com/repos/${source}/commits/${encodeURIComponent(branch)}`,
	});
	const commitJson = commitRes.json as GitHubCommitResponse;
	if (!commitJson.sha) throw new Error("Repository commit is unavailable");
	const treeRes = await requestUrl({
		url: `https://api.github.com/repos/${source}/git/trees/${commitJson.sha}?recursive=1`,
	});
	const treeJson = treeRes.json as GitHubTreeResponse;
	if (treeJson.truncated || !treeJson.tree) throw new Error("Repository tree is unavailable");

	const result = { ref: commitJson.sha, entries: treeJson.tree };
	treeCache.set(source, result);
	return result;
}

function buildCandidateNames(skillName: string, skillId: string, source: string): Set<string> {
	const idParts = skillId.split("/");
	const folderName = idParts.at(-1) || skillName;
	const candidates = new Set([folderName, skillName]);

	for (const part of source.split("/")) {
		if (skillName.startsWith(`${part}-`)) candidates.add(skillName.slice(part.length + 1));
		for (const sub of part.split("-")) {
			if (skillName.startsWith(`${sub}-`)) candidates.add(skillName.slice(sub.length + 1));
		}
	}
	return candidates;
}

async function resolveSkillDescriptor(
	source: string,
	skillName: string,
	skillId: string,
): Promise<SkillDescriptor> {
	if (!isSafeMarketplaceSource(source) || !isSafeSkillName(skillName)) {
		throw new Error("Invalid marketplace skill");
	}

	const { ref, entries } = await getRepoTree(source);
	const skillFiles = entries.filter(
		(entry) => entry.type === "blob" && entry.path.endsWith("/SKILL.md"),
	);
	const candidates = buildCandidateNames(skillName, skillId, source);
	const matches = skillFiles.filter((candidate) => candidates.has(basename(dirname(candidate.path))));
	if (matches.length !== 1) throw new Error("Skill source did not resolve to one exact directory");
	const entry = matches[0];
	if (!entry) throw new Error("Skill files were not found in the source repository");
	const directory = dirname(entry.path);
	const installName = basename(directory);
	if (!isSafeSkillName(installName)) throw new Error("Skill directory name is unsafe");
	const prefix = `${directory}/`;
	const files = entries.filter(
		(candidate) => candidate.type === "blob" && candidate.path.startsWith(prefix),
	);
	if (files.length === 0 || files.length > MAX_SKILL_FILES) {
		throw new Error("Skill contains an unsupported number of files");
	}
	const declaredBytes = files.reduce((total, file) => total + (file.size ?? 0), 0);
	if (declaredBytes > MAX_SKILL_BYTES) throw new Error("Skill is too large to install");
	const folderHash = entries.find((candidate) => candidate.type === "tree" && candidate.path === directory)?.sha ?? entry.sha;

	return { ref, entry, directory, installName, files, folderHash };
}

function encodeRawPath(path: string): string {
	return path.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function resolveContainedPath(root: string, path: string): string | null {
	const target = resolve(root, path);
	const rel = relative(resolve(root), target);
	if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
	return target;
}

async function downloadSkill(source: string, descriptor: SkillDescriptor): Promise<string> {
	const tempRoot = mkdtempSync(join(tmpdir(), "agentfiles-skill-"));
	let downloadedBytes = 0;
	try {
		for (const file of descriptor.files) {
			const relativePath = relative(descriptor.directory, file.path);
			const target = resolveContainedPath(tempRoot, relativePath);
			if (!target) throw new Error("Skill contains an unsafe file path");
			const rawUrl = `https://raw.githubusercontent.com/${source}/${descriptor.ref}/${encodeRawPath(file.path)}`;
			const response = await requestUrl({ url: rawUrl });
			const contents = Buffer.from(response.arrayBuffer);
			downloadedBytes += contents.byteLength;
			if (downloadedBytes > MAX_SKILL_BYTES) throw new Error("Skill is too large to install");
			mkdirSync(dirname(target), { recursive: true });
			writeFileSync(target, contents);
		}
		if (!existsSync(join(tempRoot, "SKILL.md"))) throw new Error("Downloaded skill has no SKILL.md");
		return tempRoot;
	} catch (error) {
		rmSync(tempRoot, { recursive: true, force: true });
		throw error;
	}
}

export async function fetchSkillContent(
	source: string,
	skillName: string,
	skillId: string,
): Promise<string | null> {
	try {
		const descriptor = await resolveSkillDescriptor(source, skillName, skillId);
		const rawUrl = `https://raw.githubusercontent.com/${source}/${descriptor.ref}/${encodeRawPath(descriptor.entry.path)}`;
		return (await requestUrl({ url: rawUrl })).text;
	} catch {
		return null;
	}
}

export async function getPopularSkills(projectRoot?: string): Promise<MarketplaceSkill[]> {
	const queries = ["react", "next", "clerk", "stripe", "ai"];
	const seen = new Set<string>();
	const results: MarketplaceSkill[] = [];

	for (const query of queries) {
		const skills = await searchSkills(query, projectRoot);
		for (const skill of skills) {
			if (seen.has(skill.id)) continue;
			seen.add(skill.id);
			results.push(skill);
		}
	}

	return results.sort((a, b) => b.installs - a.installs).slice(0, 20);
}

export const VALID_AGENTS: Array<{ id: string; label: string }> = [
	{ id: "claude-code", label: "Claude Code" },
	{ id: "cursor", label: "Cursor" },
	{ id: "codex", label: "Codex" },
	{ id: "github-copilot", label: "GitHub Copilot" },
	{ id: "windsurf", label: "Windsurf" },
	{ id: "amp", label: "Amp" },
	{ id: "opencode", label: "OpenCode" },
	{ id: "cline", label: "Cline" },
	{ id: "gemini-cli", label: "Gemini CLI" },
	{ id: "goose", label: "Goose" },
	{ id: "kiro-cli", label: "Kiro" },
	{ id: "kilo", label: "Kilo Code" },
	{ id: "roo", label: "Roo Code" },
	{ id: "continue", label: "Continue" },
	{ id: "openhands", label: "OpenHands" },
	{ id: "antigravity", label: "Antigravity" },
	{ id: "warp", label: "Warp" },
	{ id: "pi", label: "Pi" },
	{ id: "replit", label: "Replit" },
];

const VALID_AGENT_IDS = new Set(VALID_AGENTS.map(({ id }) => id));

export const TOOL_TO_AGENT: Record<string, string> = {
	"claude-code": "claude-code",
	cursor: "cursor",
	codex: "codex",
	copilot: "github-copilot",
	windsurf: "windsurf",
	amp: "amp",
	opencode: "opencode",
	antigravity: "antigravity",
	"claude-desktop": "claude-code",
	pi: "pi",
	"global-agents": "claude-code",
	aider: "claude-code",
	cline: "cline",
	"roo-code": "roo",
	kilocode: "kilo",
	continue: "continue",
	openhands: "openhands",
	goose: "goose",
};

const AGENT_SKILL_PATHS: Record<string, { globalPath: string; project: string }> = {
	"claude-code": { globalPath: join(HOME, ".claude", "skills"), project: ".claude/skills" },
	cursor: { globalPath: join(HOME, ".cursor", "skills"), project: ".agents/skills" },
	codex: { globalPath: join(HOME, ".codex", "skills"), project: ".agents/skills" },
	"github-copilot": { globalPath: join(HOME, ".copilot", "skills"), project: ".agents/skills" },
	windsurf: { globalPath: join(HOME, ".codeium", "windsurf", "skills"), project: ".windsurf/skills" },
	amp: { globalPath: join(XDG_CONFIG, "agents", "skills"), project: ".agents/skills" },
	opencode: { globalPath: join(XDG_CONFIG, "opencode", "skills"), project: ".agents/skills" },
	cline: { globalPath: join(HOME, ".agents", "skills"), project: ".agents/skills" },
	"gemini-cli": { globalPath: join(HOME, ".gemini", "skills"), project: ".agents/skills" },
	goose: { globalPath: join(XDG_CONFIG, "goose", "skills"), project: ".agents/skills" },
	"kiro-cli": { globalPath: join(HOME, ".kiro", "skills"), project: ".agents/skills" },
	kilo: { globalPath: join(HOME, ".kilocode", "skills"), project: ".agents/skills" },
	roo: { globalPath: join(HOME, ".roo", "skills"), project: ".agents/skills" },
	continue: { globalPath: join(HOME, ".continue", "skills"), project: ".continue/skills" },
	openhands: { globalPath: join(HOME, ".openhands", "skills"), project: ".agents/skills" },
	antigravity: { globalPath: join(HOME, ".gemini", "antigravity", "skills"), project: ".agents/skills" },
	warp: { globalPath: join(HOME, ".warp", "skills"), project: ".agents/skills" },
	pi: { globalPath: join(HOME, ".pi", "agent", "skills"), project: ".agents/skills" },
	replit: { globalPath: join(HOME, ".replit", "skills"), project: ".agents/skills" },
};

function getLockPaths(projectRoot?: string): string[] {
	const paths = [LOCK_PATH];
	if (projectRoot) paths.push(join(projectRoot, ".agents", ".skill-lock.json"));
	return [...new Set(paths)];
}

function getInstallLockPath(globalInstall: boolean, projectRoot?: string): string {
	if (globalInstall) return LOCK_PATH;
	if (!projectRoot) throw new Error("Project root is required for a local install");
	return join(projectRoot, ".agents", ".skill-lock.json");
}

function readLockFile(path: string): SkillLockFile {
	if (!existsSync(path)) return { version: 3, skills: {} };
	try {
		const parsed = JSON.parse(readFileSync(path, "utf-8")) as SkillLockFile;
		return { ...parsed, version: 3, skills: parsed.skills ?? {} };
	} catch {
		return { version: 3, skills: {} };
	}
}

export function writeLockFileAt(path: string, lock: SkillLockFile): void {
	mkdirSync(dirname(path), { recursive: true });
	const temporaryPath = `${path}.agentfiles-${randomUUID()}.tmp`;
	const backupPath = `${path}.agentfiles-${randomUUID()}.bak`;
	try {
		writeFileSync(temporaryPath, `${JSON.stringify(lock, null, 2)}\n`, "utf-8");
		if (existsSync(path)) renameSync(path, backupPath);
		renameSync(temporaryPath, path);
		rmSync(backupPath, { force: true });
	} catch (error) {
		if (!existsSync(path) && existsSync(backupPath)) renameSync(backupPath, path);
		throw error;
	} finally {
		rmSync(temporaryPath, { force: true });
		if (existsSync(path)) rmSync(backupPath, { force: true });
	}
}

function getInstalledStatus(projectRoot?: string): Map<string, boolean> {
	const installed = new Map<string, boolean>();
	for (const path of getLockPaths(projectRoot)) {
		for (const [name, entry] of Object.entries(readLockFile(path).skills ?? {})) {
			installed.set(name, installed.get(name) === true || Boolean(entry.agentfiles));
		}
	}
	return installed;
}

function getInstallRoots(agents: string[], globalInstall: boolean, projectRoot?: string): string[] {
	if (!globalInstall && !projectRoot) throw new Error("Project root is required for a local install");
	const canonical = globalInstall
		? join(HOME, ".agents", "skills")
		: join(projectRoot as string, ".agents", "skills");
	const roots = new Set([canonical]);
	for (const agent of agents) {
		const config = AGENT_SKILL_PATHS[agent];
		if (!config) continue;
		roots.add(globalInstall ? config.globalPath : join(projectRoot as string, config.project));
	}
	return [...roots];
}

export function installCopiesTransactional(
	sourcePath: string,
	roots: string[],
	installName: string,
): InstallCopyTransaction {
	const records: Array<{
		target: string;
		staging: string;
		stagedSkill: string;
		previousSkill: string;
		committed: boolean;
	}> = [];
	try {
		for (const root of roots) {
			const target = resolveContainedSkillPath(root, installName);
			if (!target) throw new Error("Install path is unsafe");
			mkdirSync(root, { recursive: true });
			const staging = mkdtempSync(join(root, `.agentfiles-${installName}-`));
			const stagedSkill = join(staging, installName);
			cpSync(sourcePath, stagedSkill, { recursive: true, force: true });
			records.push({
				target,
				staging,
				stagedSkill,
				previousSkill: join(staging, "previous"),
				committed: false,
			});
		}
		for (const record of records) {
			if (existsSync(record.target)) renameSync(record.target, record.previousSkill);
			renameSync(record.stagedSkill, record.target);
			record.committed = true;
		}
	} catch (error) {
		for (const record of [...records].reverse()) {
			if (record.committed) rmSync(record.target, { recursive: true, force: true });
			if (existsSync(record.previousSkill)) renameSync(record.previousSkill, record.target);
			rmSync(record.staging, { recursive: true, force: true });
		}
		throw error;
	}
	return {
		paths: records.map(({ target }) => target),
		finalize: () => {
			for (const record of records) cleanupPathBestEffort(record.staging);
		},
		rollback: () => {
			for (const record of [...records].reverse()) {
				rmSync(record.target, { recursive: true, force: true });
				if (existsSync(record.previousSkill)) renameSync(record.previousSkill, record.target);
				rmSync(record.staging, { recursive: true, force: true });
			}
		},
	};
}

export async function installSkillAsync(
	source: string,
	agents: string[],
	options: {
		globalInstall?: boolean;
		projectRoot?: string;
		skillName?: string;
		skillId?: string;
	} = {},
): Promise<{ success: boolean; output: string }> {
	if (!isSafeMarketplaceSource(source) || agents.some((agent) => !VALID_AGENT_IDS.has(agent))) {
		return { success: false, output: "Invalid marketplace install request" };
	}
	const skillName = options.skillName || "";
	if (!isSafeSkillName(skillName)) return { success: false, output: "Invalid skill name" };

	let downloadedPath: string | null = null;
	let copyTransaction: InstallCopyTransaction | null = null;
	try {
		const descriptor = await resolveSkillDescriptor(source, skillName, options.skillId || skillName);
		downloadedPath = await downloadSkill(source, descriptor);
		const globalInstall = options.globalInstall ?? true;
		const roots = getInstallRoots(agents, globalInstall, options.projectRoot);
		copyTransaction = installCopiesTransactional(downloadedPath, roots, descriptor.installName);
		const lockPath = getInstallLockPath(globalInstall, options.projectRoot);
		const lock = readLockFile(lockPath);
		const now = new Date().toISOString();
		const existing = lock.skills?.[skillName];
		if (!lock.skills) lock.skills = {};
		lock.skills[skillName] = {
			source,
			sourceType: "github",
			sourceUrl: `https://github.com/${source}`,
			ref: descriptor.ref,
			skillPath: descriptor.entry.path,
			skillFolderHash: descriptor.folderHash,
			installedAt: existing?.installedAt ?? now,
			updatedAt: now,
			agentfiles: {
				agents,
				globalInstall,
				installName: descriptor.installName,
				paths: copyTransaction.paths,
				projectRoot: options.projectRoot,
				skillId: options.skillId || skillName,
			},
		};
		writeLockFileAt(lockPath, lock);
		copyTransaction.finalize();
		const count = copyTransaction.paths.length;
		copyTransaction = null;
		return { success: true, output: `Installed ${descriptor.installName} to ${count} location(s)` };
	} catch (error) {
		copyTransaction?.rollback();
		return { success: false, output: error instanceof Error ? error.message : "Install failed" };
	} finally {
		if (downloadedPath) rmSync(downloadedPath, { recursive: true, force: true });
	}
}

export async function removeSkillAsync(skillName: string, projectRoot?: string): Promise<{ success: boolean; output: string }> {
	if (!isSafeSkillName(skillName)) return { success: false, output: "Invalid skill name" };
	let removed = 0;
	for (const lockPath of getLockPaths(projectRoot)) {
		const lock = readLockFile(lockPath);
		const entry = lock.skills?.[skillName];
		if (!entry?.agentfiles) continue;
		const staged: Array<{ path: string; backup: string }> = [];
		try {
			for (const path of entry.agentfiles.paths) {
				const parent = dirname(path);
				const contained = resolveContainedSkillPath(parent, basename(path));
				if (contained !== resolve(path) || !existsSync(path)) continue;
				const backup = `${path}.agentfiles-remove-${randomUUID()}`;
				renameSync(path, backup);
				staged.push({ path, backup });
			}
			delete lock.skills?.[skillName];
			writeLockFileAt(lockPath, lock);
		} catch (error) {
			for (const { path, backup } of [...staged].reverse()) {
				if (existsSync(backup)) renameSync(backup, path);
			}
			return { success: false, output: error instanceof Error ? error.message : "Remove failed" };
		}
		for (const { backup } of staged) cleanupPathBestEffort(backup);
		removed++;
	}
	if (removed === 0) return { success: false, output: "This install is managed by the skills CLI" };
	return { success: true, output: `Removed ${skillName}` };
}

export async function updateAllSkillsAsync(projectRoot?: string): Promise<{ success: boolean; output: string; count: number }> {
	const entries = getLockPaths(projectRoot).flatMap((path) =>
		Object.entries(readLockFile(path).skills ?? {}).filter(([, entry]) => entry.agentfiles)
	);
	let count = 0;
	const failures: string[] = [];
	for (const [skillName, entry] of entries) {
		const metadata = entry.agentfiles as InstalledSkillMetadata;
		const result = await installSkillAsync(entry.source || "", metadata.agents, {
			globalInstall: metadata.globalInstall,
			projectRoot: metadata.projectRoot,
			skillName,
			skillId: metadata.skillId,
		});
		if (result.success) count++;
		else failures.push(`${skillName}: ${result.output}`);
	}
	if (failures.length > 0) {
		return { success: false, output: failures.join("\n"), count };
	}
	return { success: true, output: `Updated ${count} skill(s)`, count };
}

export function refreshInstalledStatus(skills: MarketplaceSkill[], projectRoot?: string): MarketplaceSkill[] {
	const installed = getInstalledStatus(projectRoot);
	for (const skill of skills) {
		skill.installed = installed.has(skill.name);
		skill.managed = installed.get(skill.name) ?? false;
	}
	return skills;
}

export function formatInstalls(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return String(value);
}
