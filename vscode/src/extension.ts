import * as vscode from "vscode";
import { scanAll } from "../../src/scanner";
import { TOOL_CONFIGS } from "../../src/tool-configs";
import { TOOL_SVGS } from "../../src/tool-svgs";
import { DEFAULT_SETTINGS, type SkillItem } from "../../src/types";
import { installSkill, TOOL_TO_AGENT, VALID_AGENTS } from "../../src/marketplace";

type TreeNode = ToolNode | SkillNode;

interface ToolNode {
	kind: "tool";
	id: string;
	name: string;
	count: number;
}

interface SkillNode {
	kind: "skill";
	item: SkillItem;
	toolId: string;
}

class SkillsProvider implements vscode.TreeDataProvider<TreeNode> {
	private emitter = new vscode.EventEmitter<TreeNode | undefined>();
	readonly onDidChangeTreeData = this.emitter.event;
	private byTool = new Map<string, SkillItem[]>();
	private iconCache = new Map<string, vscode.Uri>();

	constructor(private storageUri: vscode.Uri) {}

	async refresh(): Promise<void> {
		const items = scanAll(DEFAULT_SETTINGS);
		this.byTool.clear();
		for (const item of items.values()) {
			for (const toolId of item.tools) {
				const list = this.byTool.get(toolId) || [];
				list.push(item);
				this.byTool.set(toolId, list);
			}
		}
		for (const list of this.byTool.values()) {
			list.sort((a, b) => a.name.localeCompare(b.name));
		}
		this.emitter.fire(undefined);
	}

	getChildren(node?: TreeNode): TreeNode[] {
		if (!node) {
			return TOOL_CONFIGS.filter((t) => this.byTool.has(t.id))
				.map((t) => ({
					kind: "tool" as const,
					id: t.id,
					name: t.name,
					count: this.byTool.get(t.id)?.length ?? 0,
				}));
		}
		if (node.kind === "tool") {
			return (this.byTool.get(node.id) || []).map((item) => ({
				kind: "skill" as const,
				item,
				toolId: node.id,
			}));
		}
		return [];
	}

	getTreeItem(node: TreeNode): vscode.TreeItem {
		if (node.kind === "tool") {
			const el = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
			el.description = String(node.count);
			el.contextValue = "tool";
			const icon = this.toolIcon(node.id);
			if (icon) el.iconPath = icon;
			return el;
		}
		const el = new vscode.TreeItem(node.item.name, vscode.TreeItemCollapsibleState.None);
		el.description = node.item.type;
		el.tooltip = node.item.description || node.item.filePath;
		el.resourceUri = vscode.Uri.file(node.item.filePath);
		el.command = {
			command: "vscode.open",
			title: "Open skill",
			arguments: [vscode.Uri.file(node.item.filePath)],
		};
		el.contextValue = "skill";
		return el;
	}

	private toolIcon(toolId: string): vscode.Uri | undefined {
		const svg = TOOL_SVGS[toolId];
		if (!svg) return undefined;
		const cached = this.iconCache.get(toolId);
		if (cached) return cached;
		const content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svg.viewBox}" width="16" height="16" fill="none" color="#9da5b4">${svg.paths}</svg>`;
		const uri = vscode.Uri.joinPath(this.storageUri, `${toolId}.svg`);
		vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
		this.iconCache.set(toolId, uri);
		return uri;
	}
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	await vscode.workspace.fs.createDirectory(context.globalStorageUri);
	const provider = new SkillsProvider(context.globalStorageUri);

	context.subscriptions.push(
		vscode.window.registerTreeDataProvider("agentfilesSkills", provider),
		vscode.commands.registerCommand("agentfiles.refresh", () => provider.refresh()),
		vscode.commands.registerCommand("agentfiles.installSkill", async () => {
			const source = await vscode.window.showInputBox({
				prompt: "GitHub source (owner/repo or owner/repo@skill)",
				placeHolder: "vercel-labs/agent-skills",
			});
			if (!source) return;
			const installedToolIds = TOOL_CONFIGS.filter((t) => t.isInstalled()).map((t) => t.id);
			const agentIds = [...new Set(installedToolIds.map((t) => TOOL_TO_AGENT[t]).filter(Boolean))];
			const picks = await vscode.window.showQuickPick(
				VALID_AGENTS.filter((a) => agentIds.includes(a.id)).map((a) => ({
					label: a.label,
					id: a.id,
					picked: true,
				})),
				{ canPickMany: true, title: "Install for which agents?" },
			);
			if (!picks || picks.length === 0) return;
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: `Installing ${source}...` },
				async () => {
					const result = installSkill(source, picks.map((p) => p.id));
					if (result.success) {
						vscode.window.showInformationMessage(`Installed ${source}`);
						await provider.refresh();
					} else {
						vscode.window.showErrorMessage(`Install failed: ${result.output.slice(0, 300)}`);
					}
				},
			);
		}),
	);

	await provider.refresh();
}

export function deactivate(): void {}
