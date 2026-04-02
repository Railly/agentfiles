export interface ToolConfig {
	id: string;
	name: string;
	color: string;
	icon: string;
	svg?: string;
	paths: SkillPath[];
	agentPaths: SkillPath[];
	isInstalled: () => boolean;
}

export interface SkillPath {
	baseDir: string;
	type: SkillType;
	pattern: ScanPattern;
}

export type SkillType = "skill" | "command" | "agent" | "rule" | "memory";
export type ScanPattern = "directory-with-skillmd" | "flat-md" | "mdc";

export interface SkillItem {
	id: string;
	name: string;
	description: string;
	type: SkillType;
	tools: string[];
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
		daily?: { date: string; count: number }[];
	};
	warnings?: {
		oversized: boolean;
		longDesc: boolean;
		lineCount: number;
		descChars: number;
	};
	conflicts?: { skillName: string; similarity: number }[];
	traces?: {
		traceId: string;
		timestamp: string;
		tokens: number;
		cost: number;
		duration: number;
		model: string;
	}[];
}

export type SidebarFilter =
	| { kind: "all" }
	| { kind: "favorites" }
	| { kind: "tool"; toolId: string }
	| { kind: "type"; type: SkillType }
	| { kind: "collection"; name: string }
	| { kind: "project"; project: string };

export type NamingMode = "auto" | "filename";

export type DeepSearchScope = "description" | "content" | "both";

export interface ChopsSettings {
	tools: Record<string, { enabled: boolean; customPaths: string[] }>;
	watchEnabled: boolean;
	watchDebounceMs: number;
	deepSearchDefault: boolean;
	deepSearchScope: DeepSearchScope;
	favorites: string[];
	collections: Record<string, string[]>;
	customScanPaths: string[];
	namingMode: NamingMode;
	projectScanEnabled: boolean;
	projectsHomeDir: string;
	packageRunner: "auto" | "npx" | "bunx";
}

export const DEFAULT_SETTINGS: ChopsSettings = {
	tools: {},
	watchEnabled: true,
	watchDebounceMs: 500,
	deepSearchDefault: false,
	deepSearchScope: "both",
	favorites: [],
	collections: {},
	customScanPaths: [],
	namingMode: "auto",
	projectScanEnabled: true,
	projectsHomeDir: "",
	packageRunner: "auto",
};
