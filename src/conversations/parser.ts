import { readdirSync, readFileSync, existsSync, statSync, realpathSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { createHash } from "crypto";
import type { ConversationItem, ConversationMessage } from "../types";

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

function readableProjectName(encoded: string): string {
	const home = homedir().replace(/\//g, "-").replace(/^-/, "");
	let name = encoded;
	// Remove the home prefix variations
	const prefixes = [home + "-", home.replace(/^Users-/, "") + "-"];
	for (const p of prefixes) {
		if (name.startsWith(p)) {
			name = name.slice(p.length);
			break;
		}
	}
	// Get just the last segment (project name)
	const parts = name.split("-");
	// Try to find meaningful project name from the end
	if (parts.length > 1) {
		// Common pattern: Documents-me-projectname or Documents-projectname
		const docIdx = parts.indexOf("Documents");
		if (docIdx >= 0 && docIdx < parts.length - 1) {
			return parts.slice(docIdx + 1).join("-");
		}
	}
	return name || "root";
}

function extractMessages(lines: string[]): {
	messages: ConversationMessage[];
	firstTimestamp: string;
	lastTimestamp: string;
} {
	const messages: ConversationMessage[] = [];
	let firstTimestamp = "";
	let lastTimestamp = "";

	for (const line of lines) {
		try {
			const entry = JSON.parse(line);
			const ts = entry.timestamp as string | undefined;
			if (ts) {
				if (!firstTimestamp) firstTimestamp = ts;
				lastTimestamp = ts;
			}

			if (entry.type === "user") {
				const msg = entry.message as { role?: string; content?: unknown } | undefined;
				if (!msg) continue;
				const text = extractText(msg.content);
				if (text) {
					messages.push({
						role: "human",
						text,
						timestamp: ts || "",
					});
				}
			}

			if (entry.type === "assistant") {
				const msg = entry.message as { role?: string; content?: unknown } | undefined;
				if (!msg) continue;
				const text = extractText(msg.content);
				const toolCalls = extractToolCalls(msg.content);
				if (text) {
					messages.push({
						role: "assistant",
						text,
						timestamp: ts || "",
						toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
					});
				}
			}
		} catch {
			/* skip malformed lines */
		}
	}

	return { messages, firstTimestamp, lastTimestamp };
}

function extractText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		const parts: string[] = [];
		for (const block of content) {
			if (typeof block === "object" && block !== null) {
				const b = block as Record<string, unknown>;
				if (b.type === "text" && typeof b.text === "string") {
					parts.push(b.text);
				}
			}
		}
		return parts.join("\n");
	}
	return "";
}

function extractToolCalls(content: unknown): string[] {
	if (!Array.isArray(content)) return [];
	const tools: string[] = [];
	for (const block of content) {
		if (typeof block === "object" && block !== null) {
			const b = block as Record<string, unknown>;
			if (b.type === "tool_use" && typeof b.name === "string") {
				tools.push(b.name);
			}
		}
	}
	return tools;
}

export function parseAllConversations(): ConversationItem[] {
	const conversations: ConversationItem[] = [];

	if (!existsSync(PROJECTS_DIR)) return conversations;

	let projectDirs: string[];
	try {
		projectDirs = readdirSync(PROJECTS_DIR);
	} catch {
		return conversations;
	}

	for (const projDir of projectDirs) {
		const projPath = join(PROJECTS_DIR, projDir);
		try {
			if (!statSync(projPath).isDirectory()) continue;
		} catch {
			continue;
		}

		const projectName = readableProjectName(projDir);
		let files: string[];
		try {
			files = readdirSync(projPath).filter((f) => f.endsWith(".jsonl"));
		} catch {
			continue;
		}

		for (const file of files) {
			const filePath = join(projPath, file);
			const uuid = basename(file, ".jsonl");

			try {
				const raw = readFileSync(filePath, "utf-8");
				const lines = raw.split("\n").filter((l) => l.trim());
				if (lines.length === 0) continue;

				const { messages, firstTimestamp, lastTimestamp } = extractMessages(lines);
				if (messages.length === 0) continue;

				const firstHuman = messages.find((m) => m.role === "human");
				const title = firstHuman
					? firstHuman.text.slice(0, 120).replace(/\n/g, " ")
					: "(empty conversation)";

				const id = createHash("sha256").update(realpathSync(filePath)).digest("hex").slice(0, 12);

				conversations.push({
					id,
					uuid,
					project: projectName,
					projectPath: projPath,
					title,
					firstMessage: firstHuman?.text || "",
					messages,
					messageCount: messages.filter((m) => m.role === "human").length,
					firstTimestamp,
					lastTimestamp,
					tags: [],
					customTags: [],
					isFavorite: false,
					filePath,
				});
			} catch {
				/* skip unreadable files */
			}
		}
	}

	// Sort by most recent first
	conversations.sort((a, b) => (b.lastTimestamp || "").localeCompare(a.lastTimestamp || ""));
	return conversations;
}
