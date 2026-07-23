import * as vscode from "vscode";
import type { ConversationItem } from "../../src/types";
import { openConversationPanel } from "./conversations";
import { browseMarketplace, createSkillFlow, removeSkillFlowByName, updateAllFlow } from "./parity";
import { activateRichUi } from "./rich-extension";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const rich = activateRichUi(context);
	const refresh = () => rich.refreshAll();

	context.subscriptions.push(
		vscode.commands.registerCommand("agentfiles.createSkill", () => createSkillFlow(refresh)),
		vscode.commands.registerCommand("agentfiles.browseMarketplace", () => browseMarketplace(refresh)),
		vscode.commands.registerCommand("agentfiles.updateAllSkills", () => updateAllFlow(refresh)),
		vscode.commands.registerCommand("agentfiles.removeSkillByName", () => removeSkillFlowByName(refresh)),
		vscode.commands.registerCommand("agentfiles.openConversationTab", async () => {
			const convs = rich.conversations();
			if (convs.length === 0) {
				vscode.window.showInformationMessage("No conversations loaded yet");
				return;
			}
			const pick = await vscode.window.showQuickPick(
				convs.slice(0, 200).map((c) => ({
					label: c.title.slice(0, 70),
					description: `${c.project} · ${c.messageCount} msgs`,
					conv: c as ConversationItem,
				})),
				{ title: "Open conversation in editor tab", matchOnDescription: true },
			);
			if (pick) openConversationPanel(pick.conv);
		}),
	);
}

export function deactivate(): void {}
