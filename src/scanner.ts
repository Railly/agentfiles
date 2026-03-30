import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	statSync,
} from "fs";
import { join, basename, dirname, extname } from "path";
import { parseYaml } from "obsidian";
import { createHash } from "crypto";
import { TOOL_CONFIGS } from "./tool-configs";
import type { SkillItem, SkillPath, SkillType, SkillScope, NamingMode, ChopsSettings, ProjectPathEntry } from "./types";

const IGNORED_FILES = new Set([
	"readme.md",
	"license",
	"license.md",
	"changelog.md",
	".ds_store",
	"thumbs.db",
]);

function hashPath(p: string): string {
	return createHash("sha256").update(p).digest("hex").slice(0, 12);
}

function parseFrontmatter(raw: string): {
	frontmatter: Record<string, unknown>;
	content: string;
} {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) {
		return { frontmatter: {}, content: raw };
	}
	try {
		const parsed = parseYaml(match[1]);
		return {
			frontmatter: typeof parsed === "object" && parsed ? parsed : {},
			content: match[2],
		};
	} catch { /* empty */
		return { frontmatter: {}, content: raw };
	}
}

function extractName(
	frontmatter: Record<string, unknown>,
	content: string,
	filePath: string,
	namingMode: NamingMode = "auto"
): string {
	if (namingMode === "auto") {
		if (typeof frontmatter.name === "string" && frontmatter.name) {
			return frontmatter.name;
		}
		const h1 = content.match(/^#\s+(.+)$/m);
		if (h1) return h1[1].trim();
	}
	const name = basename(filePath, extname(filePath));
	if (name === "SKILL") return basename(join(filePath, ".."));
	return name;
}

function scanDirectoryWithSkillMd(
	baseDir: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const skillFile = join(baseDir, entry.name, "SKILL.md");
		if (!existsSync(skillFile)) continue;

		const item = parseSkillFile(skillFile, type, toolId, scope, projectName, projectDir);
		if (item) items.push(item);
	}
	return items;
}

function scanFlatMd(
	baseDir: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			const skillFile = join(baseDir, entry.name, "SKILL.md");
			if (existsSync(skillFile)) {
				const item = parseSkillFile(skillFile, type, toolId, scope, projectName, projectDir);
				if (item) items.push(item);
				continue;
			}
			const mdFiles = readdirSync(join(baseDir, entry.name)).filter(
				(f) => f.endsWith(".md") && !IGNORED_FILES.has(f.toLowerCase())
			);
			const preferred =
				mdFiles.find(
					(f) => f.toLowerCase() === `${entry.name.toLowerCase()}.md`
				) || mdFiles[0];
			if (preferred) {
				const item = parseSkillFile(
					join(baseDir, entry.name, preferred),
					type,
					toolId,
					scope,
					projectName,
					projectDir
				);
				if (item) items.push(item);
			}
			continue;
		}

		const name = entry.name.toLowerCase();
		if (!name.endsWith(".md") || IGNORED_FILES.has(name)) continue;
		const item = parseSkillFile(join(baseDir, entry.name), type, toolId, scope, projectName, projectDir);
		if (item) items.push(item);
	}
	return items;
}

function scanMdc(
	baseDir: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (!entry.name.endsWith(".mdc") && !entry.name.endsWith(".md")) continue;
		if (entry.isDirectory()) continue;
		const item = parseSkillFile(join(baseDir, entry.name), type, toolId, scope, projectName, projectDir);
		if (item) items.push(item);
	}
	return items;
}

function parseSkillFile(
	filePath: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const stat = statSync(filePath);
		const { frontmatter, content } = parseFrontmatter(raw);
		let name = extractName(frontmatter, content, filePath, _namingMode);

		// For project-scoped root files, use the actual filename.
		// For nested instances (e.g. src/api/CLAUDE.md), show relative path.
		if (scope === "project" && projectDir) {
			const fname = basename(filePath);
			const rootFiles = ["CLAUDE.md", ".cursorrules", ".windsurfrules", ".aider.conf.yml", "codex.md", "copilot-instructions.md"];
			if (rootFiles.includes(fname)) {
				const fileDir = dirname(filePath);
				if (fileDir === projectDir) {
					name = fname;
				} else {
					const rel = filePath.slice(projectDir.length + 1);
					name = rel;
				}
			}
		}
		const description =
			typeof frontmatter.description === "string"
				? frontmatter.description
				: "";

		let realPath: string;
		try {
			realPath = realpathSync(filePath);
		} catch { /* empty */
			realPath = filePath;
		}

		return {
			id: hashPath(realPath),
			name,
			description,
			type,
			tools: [toolId],
			scope,
			projectDir,
			projectName,
			filePath,
			realPath,
			dirPath: join(filePath, ".."),
			content: raw,
			frontmatter,
			lastModified: stat.mtimeMs,
			fileSize: stat.size,
			isFavorite: false,
			collections: [],
		};
	} catch { /* empty */
		return null;
	}
}

const IGNORED_DIRS = new Set([
	"node_modules", ".git", ".hg", ".svn", "dist", "build", ".next",
	".nuxt", ".output", "coverage", "__pycache__", ".venv", "venv",
	".tox", ".mypy_cache", ".pytest_cache", "vendor", "target",
	".gradle", ".idea", ".vscode",
]);

function scanRecursiveFilename(
	projectRoot: string,
	filename: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	const items: SkillItem[] = [];

	function walk(dir: string, currentProjectName: string, currentProjectDir: string): void {
		try {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
					const child = join(dir, entry.name);
					// Nested repo boundary — still scan it, but as its own project
					if (existsSync(join(child, ".git"))) {
						const nestedName = basename(child);
						const nestedFile = join(child, filename);
						if (existsSync(nestedFile)) {
							const item = parseSkillFile(
								nestedFile, type, toolId, scope, nestedName, child
							);
							if (item) items.push(item);
						}
						// Recurse within the nested repo under its own identity
						walk(child, nestedName, child);
					} else {
						walk(child, currentProjectName, currentProjectDir);
					}
					continue;
				}
				if (entry.name === filename) {
					const item = parseSkillFile(
						join(dir, entry.name), type, toolId, scope, currentProjectName, currentProjectDir
					);
					if (item) items.push(item);
				}
			}
		} catch { /* empty */ }
	}

	// Check the root itself
	const rootFile = join(projectRoot, filename);
	if (existsSync(rootFile)) {
		const item = parseSkillFile(rootFile, type, toolId, scope, projectName, projectDir);
		if (item) items.push(item);
	}

	if (!existsSync(projectRoot)) return items;
	// Walk subdirectories (root file already handled above)
	try {
		for (const entry of readdirSync(projectRoot, { withFileTypes: true })) {
			if (!entry.isDirectory() || IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
			const child = join(projectRoot, entry.name);
			if (existsSync(join(child, ".git"))) {
				const nestedName = basename(child);
				const nestedFile = join(child, filename);
				if (existsSync(nestedFile)) {
					const item = parseSkillFile(
						nestedFile, type, toolId, scope, nestedName, child
					);
					if (item) items.push(item);
				}
				walk(child, nestedName, child);
			} else {
				walk(child, projectName || "", projectDir || "");
			}
		}
	} catch { /* empty */ }

	return items;
}

function scanSingleFile(
	filePath: string,
	type: SkillType,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	if (!existsSync(filePath)) return [];
	const item = parseSkillFile(filePath, type, toolId, scope, projectName, projectDir);
	return item ? [item] : [];
}

function scanPath(
	sp: SkillPath,
	toolId: string,
	scope: SkillScope = "global",
	projectName?: string,
	projectDir?: string
): SkillItem[] {
	switch (sp.pattern) {
		case "directory-with-skillmd":
			return scanDirectoryWithSkillMd(sp.baseDir, sp.type, toolId, scope, projectName, projectDir);
		case "flat-md":
			return scanFlatMd(sp.baseDir, sp.type, toolId, scope, projectName, projectDir);
		case "mdc":
			return scanMdc(sp.baseDir, sp.type, toolId, scope, projectName, projectDir);
		case "single-file":
			return scanSingleFile(sp.baseDir, sp.type, toolId, scope, projectName, projectDir);
		case "recursive-filename":
			return scanRecursiveFilename(
				dirname(sp.baseDir), basename(sp.baseDir),
				sp.type, toolId, scope, projectName, projectDir
			);
	}
}

const PROJECT_MARKERS = [".git", ".claude", ".cursor", ".windsurf", ".codex", ".github", ".amp"];

function isProjectDir(dir: string): boolean {
	for (const marker of PROJECT_MARKERS) {
		if (existsSync(join(dir, marker))) return true;
	}
	return false;
}

function findProjectDirs(dir: string, remainingDepth: number, results: string[]): void {
	if (!existsSync(dir)) return;

	if (remainingDepth === 0) {
		// At max depth, only include if it's a project
		if (isProjectDir(dir)) results.push(dir);
		return;
	}

	// Check children first — a parent may have markers but still contain projects
	const countBefore = results.length;
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
			const child = join(dir, entry.name);
			if (isProjectDir(child)) {
				results.push(child);
			} else if (remainingDepth > 1) {
				findProjectDirs(child, remainingDepth - 1, results);
			}
		}
	} catch { /* empty */ }
	const foundChildren = results.length > countBefore;

	if (!foundChildren && isProjectDir(dir)) {
		results.push(dir);
	}
}

// Module-scoped naming mode, set at the start of each scanAll call
let _namingMode: NamingMode = "auto";

function resolveProjectDirs(configuredPaths: ProjectPathEntry[]): string[] {
	const dirs: string[] = [];
	for (const entry of configuredPaths) {
		findProjectDirs(entry.path, entry.depth, dirs);
	}
	return dirs;
}

export function scanAll(settings: ChopsSettings): Map<string, SkillItem> {
	_namingMode = settings.namingMode || "auto";
	const items = new Map<string, SkillItem>();

	function addItem(item: SkillItem, toolId: string): void {
		const existing = items.get(item.id);
		if (existing) {
			if (!existing.tools.includes(toolId)) {
				existing.tools.push(toolId);
			}
		} else {
			item.isFavorite = settings.favorites.includes(item.id);
			for (const [colName, colIds] of Object.entries(settings.collections)) {
				if (colIds.includes(item.id)) {
					item.collections.push(colName);
				}
			}
			items.set(item.id, item);
		}
	}

	const projectDirs = resolveProjectDirs(settings.projectPaths);

	// Disambiguate duplicate project folder names by prefixing with parent
	const projectDisplayNames = new Map<string, string>();
	const nameCount = new Map<string, number>();
	for (const dir of projectDirs) {
		const name = basename(dir);
		nameCount.set(name, (nameCount.get(name) || 0) + 1);
	}
	for (const dir of projectDirs) {
		const name = basename(dir);
		if ((nameCount.get(name) || 0) > 1) {
			const parent = basename(dirname(dir));
			projectDisplayNames.set(dir, `${parent}/${name}`);
		} else {
			projectDisplayNames.set(dir, name);
		}
	}

	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		const toolSettings = settings.tools[tool.id];
		if (toolSettings && !toolSettings.enabled) continue;

		// Scan global (user-level) paths
		const allPaths = [...tool.paths, ...tool.agentPaths];
		for (const sp of allPaths) {
			for (const item of scanPath(sp, tool.id, "global")) {
				addItem(item, tool.id);
			}
		}

		// Scan project-level paths
		if (tool.projectPaths.length > 0 && projectDirs.length > 0) {
			for (const projectDir of projectDirs) {
				const projectName = projectDisplayNames.get(projectDir) || basename(projectDir);
				for (const pp of tool.projectPaths) {
					const fullPath = join(projectDir, pp.relDir);
					const sp: SkillPath = { baseDir: fullPath, type: pp.type, pattern: pp.pattern };
					for (const item of scanPath(sp, tool.id, "project", projectName, projectDir)) {
						addItem(item, tool.id);
					}
				}
			}
		}
	}

	return items;
}

export function getInstalledTools(): string[] {
	return TOOL_CONFIGS.filter((t) => t.isInstalled()).map((t) => t.id);
}

export function getWatchPaths(settings?: ChopsSettings): string[] {
	const pathSet = new Set<string>();
	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		const toolSettings = settings?.tools[tool.id];
		if (toolSettings && !toolSettings.enabled) continue;

		for (const sp of [...tool.paths, ...tool.agentPaths]) {
			if (existsSync(sp.baseDir)) {
				pathSet.add(sp.baseDir);
			}
		}

		// Add project-level watch paths
		if (settings && tool.projectPaths.length > 0) {
			const projectDirs = resolveProjectDirs(settings.projectPaths);
			for (const projectDir of projectDirs) {
				for (const pp of tool.projectPaths) {
					const fullPath = join(projectDir, pp.relDir);
					if (pp.pattern === "single-file") {
						// Watch the parent directory for single files
						const parentDir = dirname(fullPath);
						if (existsSync(parentDir)) pathSet.add(parentDir);
					} else if (pp.pattern === "recursive-filename") {
						// Watch the whole project dir (recursive watcher)
						if (existsSync(projectDir)) pathSet.add(projectDir);
					} else if (existsSync(fullPath)) {
						pathSet.add(fullPath);
					}
				}
			}
		}
	}
	return Array.from(pathSet);
}
