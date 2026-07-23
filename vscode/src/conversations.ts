import * as vscode from "vscode";
import { parseAllConversationsAsync } from "../../src/conversations/parser";
import { tagAllConversations } from "../../src/conversations/tagger";
import type { ConversationItem, ConversationMessage } from "../../src/types";

type ConvNode = ProjectNode | ConversationNode;

interface ProjectNode {
	kind: "project";
	name: string;
	count: number;
}

interface ConversationNode {
	kind: "conversation";
	item: ConversationItem;
}

export class ConversationsProvider implements vscode.TreeDataProvider<ConvNode> {
	private emitter = new vscode.EventEmitter<ConvNode | undefined>();
	readonly onDidChangeTreeData = this.emitter.event;
	private byProject = new Map<string, ConversationItem[]>();

	async refresh(): Promise<void> {
		const items = await parseAllConversationsAsync();
		tagAllConversations(items);
		this.byProject.clear();
		for (const item of items) {
			const list = this.byProject.get(item.project) || [];
			list.push(item);
			this.byProject.set(item.project, list);
		}
		for (const list of this.byProject.values()) {
			list.sort((a, b) => (b.lastTimestamp || "").localeCompare(a.lastTimestamp || ""));
		}
		this.emitter.fire(undefined);
	}

	getChildren(node?: ConvNode): ConvNode[] {
		if (!node) {
			return [...this.byProject.entries()]
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(([name, list]) => ({ kind: "project" as const, name, count: list.length }));
		}
		if (node.kind === "project") {
			return (this.byProject.get(node.name) || []).map((item) => ({ kind: "conversation" as const, item }));
		}
		return [];
	}

	getTreeItem(node: ConvNode): vscode.TreeItem {
		if (node.kind === "project") {
			const el = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
			el.description = String(node.count);
			el.iconPath = new vscode.ThemeIcon("folder");
			return el;
		}
		const title = node.item.title.length > 60 ? `${node.item.title.slice(0, 60)}...` : node.item.title;
		const el = new vscode.TreeItem(title, vscode.TreeItemCollapsibleState.None);
		el.description = `${node.item.messageCount} msgs`;
		el.tooltip = new vscode.MarkdownString(
			`**${node.item.title}**\n\n${node.item.project} · ${node.item.messageCount} messages\n\n${(node.item.tags || []).map((t) => `\`${t}\``).join(" ")}`,
		);
		el.iconPath = new vscode.ThemeIcon(node.item.isFavorite ? "star-full" : "comment-discussion");
		el.command = {
			command: "agentfiles.openConversation",
			title: "Open conversation",
			arguments: [node.item],
		};
		return el;
	}
}

const PAGE_SIZE = 20;

function esc(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function messageHtml(msg: ConversationMessage, index: number): string {
	const roleClass = msg.role === "human" ? "human" : "assistant";
	const roleLabel = msg.role === "human" ? "You" : "Assistant";
	const tools = (msg.toolCalls || [])
		.map((t) => `<span class="tool">${esc(t)}</span>`)
		.join("");
	const time = msg.timestamp
		? new Date(msg.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
		: "";
	return `<div class="msg ${roleClass}" data-index="${index}">
		<div class="msg-head"><span class="role">${roleLabel}</span><span class="time">${esc(time)}</span></div>
		<div class="msg-body">${esc(msg.text)}</div>
		${tools ? `<div class="msg-tools">${tools}</div>` : ""}
	</div>`;
}

export function conversationHtml(item: ConversationItem, visibleCount: number): string {
	const shown = item.messages.slice(0, visibleCount);
	const remaining = item.messages.length - visibleCount;
	const allTags = [...(item.tags || []), ...(item.customTags || [])];
	const date = item.firstTimestamp
		? new Date(item.firstTimestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
		: "";
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
	body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 0 16px 32px; max-width: 900px; margin: 0 auto; }
	.toolbar { position: sticky; top: 0; background: var(--vscode-editor-background); padding: 12px 0; border-bottom: 1px solid var(--vscode-panel-border); z-index: 2; }
	h1 { font-size: 1.1em; margin: 0 0 6px; }
	.meta { font-size: 0.85em; opacity: 0.7; display: flex; gap: 12px; }
	.tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
	.tag { font-size: 0.75em; padding: 2px 8px; border-radius: 10px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
	.actions { margin-top: 10px; display: flex; gap: 8px; }
	button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 0.85em; }
	button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
	.msg { margin: 14px 0; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--vscode-panel-border); }
	.msg.human { background: var(--vscode-editor-inactiveSelectionBackground); }
	.msg-head { display: flex; justify-content: space-between; font-size: 0.8em; opacity: 0.75; margin-bottom: 6px; }
	.role { font-weight: 600; }
	.msg-body { white-space: pre-wrap; word-break: break-word; font-size: 0.9em; line-height: 1.5; }
	.msg-tools { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
	.tool { font-family: var(--vscode-editor-font-family); font-size: 0.72em; padding: 1px 7px; border-radius: 3px; background: var(--vscode-textCodeBlock-background); }
	.more { text-align: center; margin: 20px 0; display: flex; gap: 8px; justify-content: center; }
	.resume { margin-top: 28px; padding: 12px; border: 1px dashed var(--vscode-panel-border); border-radius: 8px; }
	.resume code { display: block; margin-top: 6px; padding: 8px; background: var(--vscode-textCodeBlock-background); border-radius: 4px; font-family: var(--vscode-editor-font-family); }
</style>
</head>
<body>
	<div class="toolbar">
		<h1>${esc(item.title)}</h1>
		<div class="meta"><span>${esc(item.project)}</span><span>${item.messageCount} messages</span><span>${esc(date)}</span></div>
		${allTags.length ? `<div class="tags">${allTags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
		<div class="actions">
			<button class="primary" onclick="post('copyResume')">Copy resume command</button>
			<button onclick="post('export')">Export to markdown</button>
		</div>
	</div>
	<div id="messages">${shown.map((m, i) => messageHtml(m, i)).join("")}</div>
	${
		remaining > 0
			? `<div class="more">
				<button onclick="post('showMore')">Show next ${Math.min(PAGE_SIZE, remaining)} messages</button>
				<button onclick="post('showAll')">Show all ${item.messages.length}</button>
			</div>`
			: ""
	}
	<div class="resume">
		<strong>Resume this conversation</strong>
		<code>claude --resume ${esc(item.uuid)}</code>
	</div>
	<script>
		const vscodeApi = acquireVsCodeApi();
		function post(type) { vscodeApi.postMessage({ type }); }
	</script>
</body>
</html>`;
}

export function exportMarkdown(item: ConversationItem): string {
	const lines: string[] = [
		`# ${item.title}`,
		"",
		`- Project: ${item.project}`,
		`- Messages: ${item.messageCount}`,
		`- Session: \`claude --resume ${item.uuid}\``,
		item.tags?.length ? `- Tags: ${item.tags.join(", ")}` : "",
		"",
		"---",
		"",
	];
	for (const msg of item.messages) {
		lines.push(`## ${msg.role === "human" ? "You" : "Assistant"}`);
		lines.push("");
		lines.push(msg.text);
		if (msg.toolCalls?.length) {
			lines.push("");
			lines.push(`> Tools: ${msg.toolCalls.join(", ")}`);
		}
		lines.push("");
	}
	return lines.filter((l) => l !== undefined).join("\n");
}

export function openConversationPanel(item: ConversationItem): void {
	const panel = vscode.window.createWebviewPanel(
		"agentfilesConversation",
		item.title.slice(0, 40),
		vscode.ViewColumn.Active,
		{ enableScripts: true },
	);
	let visibleCount = PAGE_SIZE;
	panel.webview.html = conversationHtml(item, visibleCount);
	panel.webview.onDidReceiveMessage(async (msg: { type: string }) => {
		if (msg.type === "showMore") {
			visibleCount += PAGE_SIZE;
			panel.webview.html = conversationHtml(item, visibleCount);
		} else if (msg.type === "showAll") {
			visibleCount = item.messages.length;
			panel.webview.html = conversationHtml(item, visibleCount);
		} else if (msg.type === "copyResume") {
			await vscode.env.clipboard.writeText(`claude --resume ${item.uuid}`);
			vscode.window.showInformationMessage("Resume command copied");
		} else if (msg.type === "export") {
			const doc = await vscode.workspace.openTextDocument({
				content: exportMarkdown(item),
				language: "markdown",
			});
			await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
		}
	});
}
