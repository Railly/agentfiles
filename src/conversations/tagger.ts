import type { ConversationItem } from "../types";

interface TagRule {
	tag: string;
	patterns: RegExp[];
}

const TECH_TAGS: TagRule[] = [
	{ tag: "react", patterns: [/\breact\b/i, /\.tsx\b/, /\.jsx\b/, /usestate|useeffect|useref/i] },
	{ tag: "react-native", patterns: [/react.native/i, /\bexpo\b/i, /react-navigation/i] },
	{ tag: "nextjs", patterns: [/next\.js/i, /\bnextjs\b/i, /next\.config/i] },
	{ tag: "vue", patterns: [/\bvue\b/i, /\.vue\b/, /vuex|pinia/i] },
	{ tag: "angular", patterns: [/\bangular\b/i, /\.component\.ts/i] },
	{ tag: "svelte", patterns: [/\bsvelte\b/i, /\.svelte\b/] },
	{ tag: "typescript", patterns: [/typescript/i, /\.ts\b/, /tsconfig/i] },
	{ tag: "javascript", patterns: [/javascript/i, /\.js\b/, /\.mjs\b/] },
	{ tag: "python", patterns: [/\bpython\b/i, /\.py\b/, /\bpip\b/i, /django|flask|fastapi/i] },
	{ tag: "rust", patterns: [/\brust\b/i, /\.rs\b/, /cargo\.toml/i] },
	{ tag: "go", patterns: [/\bgolang\b/i, /\.go\b/, /go\.mod/i] },
	{ tag: "java", patterns: [/\bjava\b/i, /\.java\b/, /gradle|maven/i] },
	{ tag: "csharp", patterns: [/\bc#\b/i, /\.cs\b/, /unity|dotnet/i] },
	{ tag: "swift", patterns: [/\bswift\b/i, /\.swift\b/, /swiftui/i] },
	{ tag: "nestjs", patterns: [/nestjs/i, /\bnest\b/i, /@nestjs\//] },
	{ tag: "tailwind", patterns: [/tailwind/i, /tailwindcss/i] },
	{ tag: "css", patterns: [/\.css\b/, /\.scss\b/, /\.sass\b/, /styled-components/i] },
	{ tag: "node", patterns: [/node\.js/i, /\bnodejs\b/i, /package\.json/i, /\bnpm\b/i] },
	{ tag: "docker", patterns: [/\bdocker\b/i, /dockerfile/i, /docker-compose/i] },
	{ tag: "sql", patterns: [/\bsql\b/i, /postgres|mysql|sqlite/i, /prisma|typeorm|sequelize/i] },
	{ tag: "mongodb", patterns: [/\bmongo\b/i, /mongodb/i, /mongoose/i] },
	{ tag: "graphql", patterns: [/graphql/i, /\.graphql\b/, /apollo/i] },
	{ tag: "git", patterns: [/\bgit\s+(commit|push|pull|merge|rebase|checkout|branch)/i] },
	{ tag: "unity", patterns: [/\bunity\b/i, /gameobject|monobehaviour/i, /\.unity\b/] },
	{ tag: "blender", patterns: [/\bblender\b/i, /\.blend\b/, /bpy\./i] },
	{ tag: "threejs", patterns: [/three\.js/i, /threejs/i, /\br3f\b/i, /react-three/i] },
	{ tag: "aws", patterns: [/\baws\b/i, /lambda|s3|ec2|dynamodb/i] },
	{ tag: "firebase", patterns: [/firebase/i, /firestore/i] },
	{ tag: "testing", patterns: [/\bjest\b/i, /\bvitest\b/i, /\.test\.|\.spec\./i, /testing/i] },
];

const TASK_TAGS: TagRule[] = [
	{ tag: "bug-fix", patterns: [/\bfix\b/i, /\bbug\b/i, /\berror\b/i, /broken/i, /not working/i, /no funciona/i, /arregl/i] },
	{ tag: "feature", patterns: [/\badd\b/i, /\bcreate\b/i, /\bimplement\b/i, /\bnew\b/i, /agreg/i, /crea /i] },
	{ tag: "refactor", patterns: [/refactor/i, /restructur/i, /reorganiz/i, /clean.?up/i] },
	{ tag: "styling", patterns: [/\bcss\b/i, /\bstyle\b/i, /\bdesign\b/i, /layout/i, /responsive/i, /color/i, /estilo/i] },
	{ tag: "config", patterns: [/config/i, /setup/i, /install/i, /\.env\b/i, /configur/i] },
	{ tag: "api", patterns: [/\bapi\b/i, /endpoint/i, /fetch|axios/i, /request/i, /rest\b/i] },
	{ tag: "auth", patterns: [/auth/i, /login/i, /password/i, /token/i, /session/i, /jwt/i] },
	{ tag: "database", patterns: [/database/i, /migration/i, /schema/i, /seed/i, /query/i] },
	{ tag: "deployment", patterns: [/deploy/i, /ci.?cd/i, /pipeline/i, /production/i, /vercel|netlify|heroku/i] },
	{ tag: "documentation", patterns: [/\bdocs?\b/i, /readme/i, /documentation/i, /comment/i] },
	{ tag: "performance", patterns: [/performance/i, /optimi[zs]/i, /slow/i, /fast/i, /cache/i, /lazy/i] },
	{ tag: "ui-ux", patterns: [/\bui\b/i, /\bux\b/i, /component/i, /button|modal|dialog|form/i, /animation/i] },
];

function countMatches(text: string, pattern: RegExp): number {
	const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
	const matches = text.match(global);
	return matches ? matches.length : 0;
}

function matchTags(text: string, rules: TagRule[], minHits = 1): string[] {
	const matched: string[] = [];
	for (const rule of rules) {
		let totalHits = 0;
		for (const p of rule.patterns) {
			totalHits += countMatches(text, p);
		}
		if (totalHits >= minHits) {
			matched.push(rule.tag);
		}
	}
	return matched;
}

export function generateTags(conversation: ConversationItem): string[] {
	const tags = new Set<string>();

	// Always add project as tag
	if (conversation.project && conversation.project !== "root") {
		tags.add(conversation.project);
	}

	// Only scan the FIRST few human messages — later messages often contain
	// meta-discussion about tags/tools that creates false positives
	// (e.g. "why does it show blender?" adds a blender mention)
	const humanMessages = conversation.messages
		.filter((m) => m.role === "human")
		.slice(0, 5);
	// Strip system-reminder blocks — they contain MCP tool names, context
	// injections, and other system content that creates false tag matches
	const searchText = humanMessages
		.map((m) => m.text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ""))
		.join(" ");

	// Only check tool calls from assistant (these are actual actions taken)
	const assistantMessages = conversation.messages
		.filter((m) => m.role === "assistant");
	const allToolCalls = assistantMessages.flatMap((m) => m.toolCalls || []);

	// Tech tags — require 3+ mentions to avoid false positives from
	// casual references (e.g. "it says blender" in a complaint)
	for (const tag of matchTags(searchText, TECH_TAGS, 3)) {
		tags.add(tag);
	}

	// Task type tags — 2+ mentions is enough since these are more intentional
	for (const tag of matchTags(searchText, TASK_TAGS, 2)) {
		tags.add(tag);
	}

	// MCP tool-based tags — these are actual integrations used
	if (allToolCalls.some((t) => t.includes("mcp__blender"))) {
		tags.add("blender");
	}
	if (allToolCalls.some((t) => t.includes("mcp-unity") || t.includes("mcp__mcp-unity"))) {
		tags.add("unity");
	}

	return Array.from(tags).sort();
}

export function tagAllConversations(conversations: ConversationItem[]): void {
	for (const conv of conversations) {
		conv.tags = generateTags(conv);
	}
}
