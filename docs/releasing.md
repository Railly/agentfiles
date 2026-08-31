# Releasing Agentfiles

Community scorecard scans must inspect only the Obsidian plugin source. Release tags therefore use a generated plugin-only commit that excludes the website and VS Code extension.

## Prepare a release

1. Update `package.json`, `manifest.json`, and `versions.json` to the same version.
2. Run `bun install`, `bun run check`, and `bun run release:tag`.
3. Inspect the generated tag with `git ls-tree -r --name-only <version>`.
4. Push the source branch and the generated tag after review.

The release workflow rejects tags containing `scripts/`, `web/`, or `vscode/`, installs with the frozen lockfile, reruns every check, builds the plugin, and attaches provenance for `main.js`, `manifest.json`, and `styles.css`.

## Expected scorecard capabilities

Direct filesystem access remains expected because Agentfiles reads and manages desktop agent files outside the vault. Shell execution is not expected. A shell execution finding in a release tag blocks release review.
