export interface ToolConfig {
	id: string;
	name: string;
	color: string;
	icon: string;
	svg?: string;
	paths: SkillPath[];
	agentPaths: SkillPath[];
	projectPaths: ProjectSkillPath[];
	isInstalled: () => boolean;
}

export interface SkillPath {
	baseDir: string;
	type: SkillType;
	pattern: ScanPattern;
}

export interface ProjectSkillPath {
	relDir: string;
	type: SkillType;
	pattern: ScanPattern;
}

export type SkillType = "skill" | "command" | "agent" | "rule" | "memory";
export type ScanPattern = "directory-with-skillmd" | "flat-md" | "mdc" | "single-file" | "recursive-filename";
export type SkillScope = "global" | "project";

export interface ProjectPathEntry {
	path: string;
	depth: number;
}

export interface SkillItem {
	id: string;
	name: string;
	description: string;
	type: SkillType;
	tools: string[];
	scope: SkillScope;
	projectDir?: string;
	projectName?: string;
	filePath: string;
	realPath: string;
	dirPath: string;
	content: string;
	frontmatter: Record<string, unknown>;
	lastModified: number;
	fileSize: number;
	isFavorite: boolean;
	collections: string[];
	usage?: {
		uses: number;
		lastUsed: string | null;
		daysSinceUsed: number | null;
		isStale: boolean;
		isHeavy: boolean;
	};
}

export type SidebarFilter =
	| { kind: "all" }
	| { kind: "favorites" }
	| { kind: "tool"; toolId: string }
	| { kind: "type"; type: SkillType }
	| { kind: "collection"; name: string }
	| { kind: "scope"; scope: SkillScope }
	| { kind: "project"; projectPath: string };

export type NamingMode = "auto" | "filename";

export interface ChopsSettings {
	tools: Record<string, { enabled: boolean; customPaths: string[] }>;
	watchEnabled: boolean;
	watchDebounceMs: number;
	favorites: string[];
	collections: Record<string, string[]>;
	customScanPaths: string[];
	projectPaths: ProjectPathEntry[];
	namingMode: NamingMode;
}

export const DEFAULT_SETTINGS: ChopsSettings = {
	tools: {},
	watchEnabled: true,
	watchDebounceMs: 500,
	favorites: [],
	collections: {},
	customScanPaths: [],
	projectPaths: [],
	namingMode: "auto",
};
