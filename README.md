# VS Code Learn

Gamifies the VS Code Learn courses with an embedded Markdown reader, local progress tracking, history, and achievements.

## Data source

The extension uses the public [`microsoft/vscode-docs`](https://github.com/microsoft/vscode-docs/tree/main/learn) repository:

- `learn/toc.json` provides course order, titles, descriptions, and lesson paths.
- `learn/{area}/{lesson}.md` provides Markdown lesson content for the embedded reader.

A generated catalog is bundled so the extension works offline. Runtime sync checks for updates at most once every 24 hours by default and can be triggered manually with **VS Code Learn: Refresh Course Catalog**.

## Development

```bash
npm install
npm run compile
npm test
npm run generate:catalog
```

Press `F5` in VS Code to launch an Extension Development Host.

## Publishing

Releases are published to the VS Code Marketplace automatically by the
[`Publish`](.github/workflows/publish.yml) GitHub Actions workflow whenever a
GitHub Release is published. A separate [`CI`](.github/workflows/ci.yml) workflow
compiles, tests, and packages the extension on every push and pull request.

### One-time setup

1. **Create a publisher.** Sign in at the
   [Visual Studio Marketplace publisher portal](https://marketplace.visualstudio.com/manage)
   and create a publisher. The publisher ID must match the `publisher` field in
   `package.json` (currently `vs-publisher-473885`).
2. **Create a Personal Access Token (PAT).** In
   [Azure DevOps](https://dev.azure.com), create a token with **Marketplace →
   Manage** scope (organization: *All accessible organizations*).
3. **Add the token as a repository secret** named `VSCE_PAT`
   (GitHub repo → *Settings* → *Secrets and variables* → *Actions*).
   The workflow also accepts `VSCE_TOKEN` for compatibility with other repos.
4. *(Optional)* To also publish to [Open VSX](https://open-vsx.org), add an
   `OVSX_PAT` secret. If it is absent the workflow simply skips that step.

### Versioning

The published version is set **automatically** to `1.0.<build-number>`, where the
build number is the GitHub Actions run number of the `Publish` workflow. You never
need to bump the version manually — each publish gets a unique, increasing version.
(The `version` in `package.json` is only a placeholder for local development.)

### Cutting a release

Just trigger the `Publish` workflow — no version bump needed:

- **Create a GitHub Release** (recommended), or
- Run it manually via *Actions → Publish → Run workflow*.

The workflow tests, stamps the version as `1.0.<run-number>`, packages, publishes to
the Marketplace, and always handles the GitHub release artifact:

- If triggered by a GitHub release event, it attaches the `.vsix` to that release.
- If triggered manually, it automatically creates a GitHub release/tag
  `v1.0.<run-number>` and uploads the `.vsix`.

### Publishing manually from your machine

```bash
npm run package                 # creates the .vsix locally
npx @vscode/vsce login vs-publisher-473885
npm run publish                 # or: npx @vscode/vsce publish
```

## MVP behavior

- Local-first state only; no account, cloud sync, telemetry, or leaderboard.
- Lesson content is fetched on demand from GitHub raw Markdown and cached in extension global storage.
- Progress and achievement state is stored in VS Code global state.
- Reset-all progress requires confirmation.
