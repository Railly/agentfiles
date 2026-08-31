import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { RELEASE_PATHS } from "./release-files";

function git(args: string[], env?: Record<string, string>): string {
	const result = Bun.spawnSync(["git", ...args], {
		env: { ...process.env, ...env },
		stdout: "pipe",
		stderr: "pipe",
	});
	if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim() || `git ${args[0]} failed`);
	return result.stdout.toString().trim();
}

const packageVersion = (JSON.parse(readFileSync("package.json", "utf-8")) as { version: string }).version;
const manifestVersion = (JSON.parse(readFileSync("manifest.json", "utf-8")) as { version: string }).version;
const requestedVersion = process.argv[2] ?? packageVersion;

if (!/^\d+\.\d+\.\d+$/.test(requestedVersion)) throw new Error("Release version must use x.y.z format");
if (packageVersion !== requestedVersion || manifestVersion !== requestedVersion) {
	throw new Error("package.json and manifest.json must match the release version");
}
if (git(["status", "--porcelain"])) throw new Error("Commit all release changes before creating the tag");
if (git(["tag", "--list", requestedVersion])) throw new Error(`Tag ${requestedVersion} already exists`);
for (const path of RELEASE_PATHS) {
	if (!existsSync(path)) throw new Error(`Missing release path: ${path}`);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "agentfiles-release-"));
const indexPath = join(temporaryDirectory, "index");
const env = { GIT_INDEX_FILE: indexPath };

try {
	git(["read-tree", "--empty"], env);
	git(["add", "--", ...RELEASE_PATHS], env);
	const tree = git(["write-tree"], env);
	const parent = git(["rev-parse", "HEAD"]);
	const commit = git(["commit-tree", tree, "-p", parent, "-m", `release: ${requestedVersion} plugin source`]);
	git(["tag", "-a", requestedVersion, commit, "-m", `Agentfiles ${requestedVersion}`]);
	console.log(`${requestedVersion} ${commit}`);
} finally {
	rmSync(temporaryDirectory, { recursive: true, force: true });
}
