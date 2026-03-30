import { Modal, type App } from "obsidian";

export function showConfirmModal(
	app: App,
	title: string,
	message: string,
	onConfirm: () => void
): void {
	const modal = new ConfirmModal(app, title, message, onConfirm);
	modal.open();
}

class ConfirmModal extends Modal {
	private title: string;
	private message: string;
	private onConfirm: () => void;

	constructor(app: App, title: string, message: string, onConfirm: () => void) {
		super(app);
		this.title = title;
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("as-confirm-modal");

		contentEl.createEl("p", {
			cls: "as-confirm-title",
			text: this.title,
		});
		contentEl.createEl("p", {
			cls: "as-confirm-message",
			text: this.message,
		});

		const buttons = contentEl.createDiv("as-confirm-buttons");
		const cancelBtn = buttons.createEl("button", {
			cls: "as-confirm-cancel",
			text: "Cancel",
		});
		cancelBtn.addEventListener("click", () => this.close());

		const confirmBtn = buttons.createEl("button", {
			cls: "as-confirm-action mod-warning",
			text: "Confirm",
		});
		confirmBtn.addEventListener("click", () => {
			this.close();
			this.onConfirm();
		});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
