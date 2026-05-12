interface ElectronShell {
	openExternal(url: string): Promise<void>;
	showItemInFolder(fullPath: string): void;
}

interface ElectronModule {
	shell: ElectronShell;
}

function getElectronShell(): ElectronShell | null {
	try {
		const req = (window as unknown as { require?: (id: string) => unknown }).require;
		if (typeof req !== "function") return null;
		const mod = req("electron") as ElectronModule | undefined;
		return mod?.shell ?? null;
	} catch {
		return null;
	}
}

export function openExternal(url: string): void {
	const shell = getElectronShell();
	if (shell) {
		void shell.openExternal(url);
		return;
	}
	window.open(url, "_blank");
}

export function showItemInFolder(fullPath: string): void {
	const shell = getElectronShell();
	if (shell) {
		shell.showItemInFolder(fullPath);
	}
}
