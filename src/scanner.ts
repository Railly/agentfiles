import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	statSync,
} from "fs";
import { join, basename, extname } from "path";
import { parseYaml } from "obsidian";
import { createHash } from "crypto";
import { TOOL_CONFIGS } from "./tool-configs";
import type { SkillItem, SkillPath, SkillType, ChopsSettings } from "./types";

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
	pattern: ScanPattern
): string {
	if (typeof frontmatter.name === "string" && frontmatter.name) {
		return frontmatter.name;
	}
	const name = basename(filePath, extname(filePath));
	if (name === "SKILL") return basename(join(filePath, ".."));
	if (pattern === "flat-md" || pattern === "mdc") return name;
	const h1 = content.match(/^#\s+(.+)$/m);
	if (h1) return h1[1].trim();
	return name;
}

function scanDirectoryWithSkillMd(
	baseDir: string,
	type: SkillType,
	toolId: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
		const skillFile = join(baseDir, entry.name, "SKILL.md");
		if (!existsSync(skillFile)) continue;

		const item = parseSkillFile(skillFile, type, toolId);
		if (item) items.push(item);
	}
	return items;
}

function scanFlatMd(
	baseDir: string,
	type: SkillType,
	toolId: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (entry.isDirectory() || entry.isSymbolicLink()) {
			const skillFile = join(baseDir, entry.name, "SKILL.md");
			if (existsSync(skillFile)) {
				const item = parseSkillFile(skillFile, type, toolId);
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
					toolId
				);
				if (item) items.push(item);
			}
			continue;
		}

		const fname = entry.name.toLowerCase();
		if (!fname.endsWith(".md") || IGNORED_FILES.has(fname)) continue;
		const item = parseSkillFile(join(baseDir, entry.name), type, toolId, "flat-md");
		if (item) items.push(item);
	}
	return items;
}

function scanMdc(
	baseDir: string,
	type: SkillType,
	toolId: string
): SkillItem[] {
	if (!existsSync(baseDir)) return [];
	const items: SkillItem[] = [];

	for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
		if (!entry.name.endsWith(".mdc") && !entry.name.endsWith(".md")) continue;
		if (entry.isDirectory()) continue;
		const item = parseSkillFile(join(baseDir, entry.name), type, toolId, "mdc");
		if (item) items.push(item);
	}
	return items;
}

function parseSkillFile(
	filePath: string,
	type: SkillType,
	toolId: string,
	pattern: ScanPattern = "directory-with-skillmd"
): SkillItem | null {
	try {
		const raw = readFileSync(filePath, "utf-8");
		const stat = statSync(filePath);
		const { frontmatter, content } = parseFrontmatter(raw);
		const name = extractName(frontmatter, content, filePath, pattern);
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

function scanPath(sp: SkillPath, toolId: string): SkillItem[] {
	switch (sp.pattern) {
		case "directory-with-skillmd":
			return scanDirectoryWithSkillMd(sp.baseDir, sp.type, toolId);
		case "flat-md":
			return scanFlatMd(sp.baseDir, sp.type, toolId);
		case "mdc":
			return scanMdc(sp.baseDir, sp.type, toolId);
	}
}

function scanProjectSkills(projectRoot: string, toolId: string): SkillItem[] {
	const results: SkillItem[] = [];
	const projectDirs = [
		{ sub: ".claude/skills", type: "skill" as SkillType, pattern: "directory-with-skillmd" as ScanPattern },
		{ sub: ".claude/commands", type: "command" as SkillType, pattern: "flat-md" as ScanPattern },
		{ sub: ".claude/agents", type: "agent" as SkillType, pattern: "flat-md" as ScanPattern },
		{ sub: ".cursor/skills", type: "skill" as SkillType, pattern: "directory-with-skillmd" as ScanPattern },
		{ sub: ".codex/skills", type: "skill" as SkillType, pattern: "directory-with-skillmd" as ScanPattern },
	];
	for (const dir of projectDirs) {
		const fullPath = join(projectRoot, dir.sub);
		if (!existsSync(fullPath)) continue;
		const sp: SkillPath = { baseDir: fullPath, type: dir.type, pattern: dir.pattern };
		results.push(...scanPath(sp, toolId));
	}
	return results;
}

export function scanAll(settings: ChopsSettings): Map<string, SkillItem> {
	const items = new Map<string, SkillItem>();
	const nameMap = new Map<string, string>();

	function addItem(item: SkillItem, toolId: string): void {
		const existingById = items.get(item.id);
		if (existingById) {
			if (!existingById.tools.includes(toolId)) {
				existingById.tools.push(toolId);
			}
			return;
		}

		const existingId = nameMap.get(item.name);
		if (existingId) {
			const existing = items.get(existingId);
			if (existing && !existing.tools.includes(toolId)) {
				existing.tools.push(toolId);
			}
			return;
		}

		item.isFavorite = settings.favorites.includes(item.id);
		for (const [colName, colIds] of Object.entries(settings.collections)) {
			if (colIds.includes(item.id)) {
				item.collections.push(colName);
			}
		}
		items.set(item.id, item);
		nameMap.set(item.name, item.id);
	}

	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		const toolSettings = settings.tools[tool.id];
		if (toolSettings && !toolSettings.enabled) continue;

		const allPaths = [...tool.paths, ...tool.agentPaths];
		for (const sp of allPaths) {
			for (const item of scanPath(sp, tool.id)) {
				addItem(item, tool.id);
			}
		}
	}

	for (const projectPath of settings.customScanPaths) {
		if (!existsSync(projectPath)) continue;
		for (const item of scanProjectSkills(projectPath, "claude-code")) {
			addItem(item, "claude-code");
		}
	}

	return items;
}

export function getInstalledTools(): string[] {
	return TOOL_CONFIGS.filter((t) => t.isInstalled()).map((t) => t.id);
}

export function getWatchPaths(): string[] {
	const paths: string[] = [];
	for (const tool of TOOL_CONFIGS) {
		if (!tool.isInstalled()) continue;
		for (const sp of [...tool.paths, ...tool.agentPaths]) {
			if (existsSync(sp.baseDir)) {
				paths.push(sp.baseDir);
			}
		}
	}
	return paths;
}
