import type { ConversationItem, ConversationMessage } from "../types";

export interface ExportOptions {
	selectedMessages: ConversationMessage[];
	conversation: ConversationItem;
	vaultPath: string;
}

function formatTimestamp(ts: string): string {
	if (!ts) return "";
	const d = new Date(ts);
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "")
		.replace(/\s+/g, "-")
		.slice(0, 80);
}

export function generateNotePath(conversation: ConversationItem, vaultPath: string): string {
	const date = conversation.firstTimestamp
		? new Date(conversation.firstTimestamp).toISOString().slice(0, 10)
		: "unknown-date";
	const slug = sanitizeFilename(conversation.title.slice(0, 60));
	return `${vaultPath}/Claude Sessions/${date}-${slug}.md`;
}

export function generateNoteContent(options: ExportOptions): string {
	const { selectedMessages, conversation } = options;
	const allTags = [...conversation.tags, ...conversation.customTags];
	const tagList = allTags.map((t) => `"${t}"`).join(", ");

	const lines: string[] = [];

	// Frontmatter
	lines.push("---");
	lines.push(`tags: [claude-session, ${tagList}]`);
	lines.push(`session: ${conversation.uuid}`);
	lines.push(`project: ${conversation.project}`);
	lines.push(`date: ${conversation.firstTimestamp ? new Date(conversation.firstTimestamp).toISOString().slice(0, 10) : "unknown"}`);
	lines.push(`messages: ${conversation.messageCount}`);
	lines.push("---");
	lines.push("");

	// Title
	lines.push(`# ${conversation.title.slice(0, 100)}`);
	lines.push("");

	// Context
	lines.push("## Context");
	lines.push(`- **Project:** ${conversation.project}`);
	lines.push(`- **Started:** ${formatTimestamp(conversation.firstTimestamp)}`);
	lines.push(`- **Last activity:** ${formatTimestamp(conversation.lastTimestamp)}`);
	lines.push(`- **Messages:** ${conversation.messageCount}`);
	if (allTags.length > 0) {
		lines.push(`- **Tags:** ${allTags.map((t) => `\`${t}\``).join(" ")}`);
	}
	lines.push("");

	// Selected snippets
	if (selectedMessages.length > 0) {
		lines.push("## Key Snippets");
		lines.push("");
		for (const msg of selectedMessages) {
			const icon = msg.role === "human" ? "You" : "Claude";
			const time = formatTimestamp(msg.timestamp);
			lines.push(`### ${icon} ${time ? `(${time})` : ""}`);
			lines.push("");
			if (msg.role === "human") {
				lines.push(`> ${msg.text.replace(/\n/g, "\n> ")}`);
			} else {
				lines.push(msg.text);
			}
			lines.push("");
		}
	}

	// Resume command
	lines.push("## Resume");
	lines.push("");
	lines.push("```bash");
	lines.push(`claude --resume ${conversation.uuid}`);
	lines.push("```");

	return lines.join("\n");
}
