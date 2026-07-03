# VS Code Learn

<p align="center">
  <img src="media/icon.png" alt="VS Code Learn icon" width="128" height="128">
</p>

<p align="center">
  <strong>Level up your VS Code learning journey without leaving the editor.</strong>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=vs-publisher-473885.vscode-learn"><img src="https://img.shields.io/visual-studio-marketplace/v/vs-publisher-473885.vscode-learn?label=Marketplace&color=007ACC" alt="Visual Studio Marketplace version"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=vs-publisher-473885.vscode-learn"><img src="https://img.shields.io/visual-studio-marketplace/i/vs-publisher-473885.vscode-learn?label=Installs&color=brightgreen" alt="Visual Studio Marketplace installs"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=vs-publisher-473885.vscode-learn"><img src="https://img.shields.io/visual-studio-marketplace/r/vs-publisher-473885.vscode-learn?label=Rating&color=orange" alt="Visual Studio Marketplace rating"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/jamesmontemagno/vscode-learn?color=blue" alt="MIT license"></a>
</p>

**VS Code Learn** brings the official VS Code Learn courses into a focused, gamified extension experience. Browse courses, read lessons in an embedded Markdown reader, track your progress locally, and unlock achievements as you build momentum.

## Why install VS Code Learn?

- **Learn where you code** — open lessons directly inside VS Code with a clean embedded reader.
- **Track your journey** — mark lessons started or complete and revisit your learning history.
- **Unlock achievements** — earn milestone badges for first steps, streaks, course completion, and more.
- **Stay focused** — browse the VS Code Learn course catalog from the Activity Bar.
- **Works offline** — a generated course catalog ships with the extension, and content is cached locally once it is loaded.
- **Local-first by design** — progress, history, and achievements stay in VS Code global storage.

## What is VS Code Learn?

[VS Code Learn](https://code.visualstudio.com/learn) is a collection of official learning content from the VS Code team. It helps developers discover editor features, customize their setup, and build better workflows with step-by-step guidance.

This extension wraps that learning content in a more interactive experience:

1. Open the **VS Code Learn** Activity Bar view.
2. Pick a course and lesson.
3. Read the lesson in VS Code.
4. Mark progress as you go.
5. Celebrate achievements as you complete milestones.

## Features

### Course catalog

Browse the bundled VS Code Learn course catalog from the sidebar. Refresh the catalog at any time with **VS Code Learn: Refresh Course Catalog**.

### Embedded lesson reader

Lessons open in a VS Code webview with rendered Markdown, links, and actions for progress tracking.

### Progress tracking

Track started and completed lessons locally. Reset one lesson, all progress, or all extension data whenever you need a fresh start.

### Achievements and history

Earn themed achievement badges and review recent learning activity from dedicated sidebar views.

## Commands

Open the Command Palette and search for **VS Code Learn** to find:

- **VS Code Learn: Show Dashboard**
- **VS Code Learn: Open Lesson**
- **VS Code Learn: Refresh Course Catalog**
- **VS Code Learn: Show Achievements**
- **VS Code Learn: Mark Lesson Started**
- **VS Code Learn: Mark Lesson Complete**
- **VS Code Learn: Reset Lesson Progress**
- **VS Code Learn: Reset All Progress**
- **VS Code Learn: Reset All Data**

## Data source

The extension uses the public [`microsoft/vscode-docs`](https://github.com/microsoft/vscode-docs/tree/main/learn) repository:

- `learn/toc.json` provides course order, titles, descriptions, and lesson paths.
- `learn/{area}/{lesson}.md` provides Markdown lesson content for the embedded reader.

A generated catalog is bundled so the extension works offline. Runtime sync checks for updates at most once every 24 hours by default and can be triggered manually with **VS Code Learn: Refresh Course Catalog**.

## Privacy

VS Code Learn is local-first:

- No account is required.
- No leaderboard is used.
- No telemetry is collected by this extension.
- Progress, achievement state, and history are stored in VS Code global state.
- Lesson Markdown is cached in extension global storage after it is fetched.

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

## Local storage locations

- **Windows lesson markdown cache files:** `%APPDATA%\Code\User\globalStorage\vs-publisher-473885.vscode-learn\content`
- **Windows VS Code global state DB (contains progress/achievements/history and cached catalog metadata):** `%APPDATA%\Code\User\globalStorage\state.vscdb`
