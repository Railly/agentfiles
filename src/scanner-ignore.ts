const IGNORED_FILES = new Set([
	"readme.md",
	"license",
	"license.md",
	"changelog.md",
	"history.md",
	"changes.md",
	"authors",
	"notice",
	".gitignore",
	".gitkeep",
	".ds_store",
	"thumbs.db",
]);

export function isScannableMarkdownFile(fileName: string): boolean {
	const normalized = fileName.toLowerCase();
	return normalized.endsWith(".md") && !IGNORED_FILES.has(normalized);
}
