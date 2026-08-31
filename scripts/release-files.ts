export const RELEASE_PATHS = [
	".github/workflows/release.yml",
	"LICENSE",
	"README.md",
	"assets",
	"bun.lock",
	"esbuild.config.mjs",
	"eslint.config.mjs",
	"manifest.json",
	"package.json",
	"src",
	"styles.css",
	"tsconfig.json",
	"versions.json",
];

export const PROHIBITED_RELEASE_PREFIXES = ["scripts/", "web/", "vscode/"];

export function hasProhibitedReleasePath(paths: string[]): boolean {
	return paths.some((path) => PROHIBITED_RELEASE_PREFIXES.some((prefix) => path.startsWith(prefix)));
}
