# VS Code Learn — Copilot Instructions

Local-first VS Code extension that gamifies official VS Code Learn courses: catalog browsing, embedded Markdown reader, progress/history, and achievements.

## Product principles

- **Local-first**: progress, achievements, history, and content cache live in VS Code `globalState` / `globalStorageUri`. No accounts, leaderboards, or telemetry.
- **Source of truth**: `microsoft/vscode-docs` (`learn/toc.json` + lesson Markdown). Bundle a generated offline catalog; refresh remote data opportunistically.
- **Explicit completion**: do not auto-complete from scroll. Opening starts a lesson; user marks complete.
- **Sidebar = navigation, webviews = delight**: keep trees fast/native; put rich UI in dashboard, reader, and achievement panels.

## Architecture map

| Area | Path | Role |
|------|------|------|
| Activation / wiring | `src/extension.ts` | Providers, panels, command registration |
| Commands | `src/commands/commandRegistrations.ts` | All `vscodeLearn.*` command handlers |
| Catalog | `src/catalog/*`, `src/generated/learnCatalog.generated.ts` | Course/lesson model + offline catalog |
| Content | `src/content/*` | Markdown fetch/cache/render |
| Progress | `src/progress/*` | Lesson state, history, achievement evaluation |
| Views | `src/views/*` | Trees + webview panels + shared HTML/CSS |
| Catalog gen | `scripts/generateCatalog.mjs` | Emits generated catalog module |

## Design system (webviews)

Shared chrome lives in `src/views/webviewHtml.ts`. Course identity helpers live in `src/views/courseTheme.ts`.

### Theme-first (non-negotiable)

- Style with VS Code CSS variables only for chrome: `--vscode-foreground`, `--vscode-editor-background`, `--vscode-button-*`, `--vscode-panel-border`, `--vscode-charts-*`, `--vscode-descriptionForeground`, `--vscode-focusBorder`, etc.
- Course accents via classes + chart tokens, **not** hardcoded brand hex:
  - Foundations → `charts-blue` / `layers`
  - Customizations → `charts-purple` / `paintcan`
  - Agents → `charts-green` / `extensions`
- Use `color-mix(...)` for soft fills, borders, and glow. Respect High Contrast via existing tokens/borders.
- Honor `prefers-reduced-motion` for confetti and transitions.

### UI patterns

- **Dashboard**: hero path → stats → course cards → trophy case → recent activity.
- **Course cards**: ring progress, description, lesson dots, CTA. Keep vertical spacing between description / dots / CTA (do not crush them).
- **Lesson reader**: compact sticky chrome; iconized nav (Prev/Next/Official/Dashboard); path dots on the **same row** as nav; progress ring label centered with grid stacking (not absolute-only hacks).
- **Achievements**:
  - Featured badge on detail page should be **large** (~300px-class) and fill the glow.
  - Related/dashboard tiles: badge → **name** → Locked/Unlocked **under** the name (`vl-badge-meta`).
- Prefer CSS classes (`vl-*`) over inline layout styles except one-off values.

### Webview actions

- Prefer `enableCommandUris: true` + `command:vscodeLearn.*` links for navigation when the extension is activated.
- Lesson complete uses `postMessage` + confetti (see `webviewHtml` script + `LessonReaderPanel` message handler).
- Keep CSP strict: no remote scripts; allow images from trusted HTTPS + webview sources.

## Commands and activation

- Every command used from menus, trees, or webviews must be:
  1. Listed under `contributes.commands` in `package.json`
  2. Registered in `registerCommands`
  3. Covered by an `activationEvents` `onCommand:...` entry (or activated via a view the user already opened)
- Missing activation events or failed activation both surface as **“command not found”**.
- Wrap network-y commands (e.g. `refreshCatalog`) in try/catch and show user-facing error messages.

## Catalog, sync, and content loading

- Bundled catalog: `src/generated/learnCatalog.generated.ts` (do not hand-edit; regenerate).
- Generate: `npm run generate:catalog`
- Runtime: `CatalogProvider` uses remote catalog when available, falls back to generated; `refreshIfDue()` on activate (interval from settings).
- Lesson Markdown: on-demand fetch via `LessonContentService`, cached under global storage; show a clear **cached** indicator when serving cache.
- Settings: `vscodeLearn.sync.enabled`, `vscodeLearn.sync.intervalHours`, `vscodeLearn.sync.branch`.

## Build, package, install (critical)

```bash
npm install
npm run compile
npm test
npm run generate:catalog   # when catalog source changes
npx @vscode/vsce package   # MUST include production deps
code-insiders --install-extension ./vscode-learn-0.0.1.vsix --force
```

### Packaging gotchas (learned the hard way)

- **Never package with `--no-dependencies`** for this extension. `markdown-it` is a runtime dependency; omitting it causes **activation failure**, which makes every command appear missing.
- After packaging, verify `node_modules/markdown-it` exists inside the VSIX / installed extension folder.
- Prefer uninstall + reinstall when debugging stale installs:
  - `code-insiders --uninstall-extension vs-publisher-473885.vscode-learn`
  - then install the new VSIX and **Developer: Reload Window**
- Development Host (F5) is fine for iteration; VSIX install is required to validate packaged runtime (deps, activation, menus).

## Debugging checklist

1. **Command not found**
   - Is the extension activated? Check Extension Host log / Developer Tools console for require/activation errors.
   - Is the command in `contributes.commands`, `registerCommand`, and `activationEvents`?
   - Was the VSIX packaged **with** dependencies?
2. **UI not updating**
   - Confirm you reloaded the Insiders/Extension Host window after install.
   - Webview HTML is regenerated on `render()` / open; dispose + reopen panel if testing sticky state.
3. **Catalog refresh failures**
   - Network/branch/settings issues; user should get an error toast, not a silent failure.
4. **Theme breakage**
   - Search for hardcoded colors in webview CSS; replace with tokens / `color-mix`.

## Coding conventions

- TypeScript, strict, CommonJS emit to `out/` (`tsconfig.json` `rootDir: "."`).
- Keep pure achievement logic in `src/progress/achievements.ts` and cover with tests under `test/suite/`.
- Prefer small focused modules over growing webview HTML generators without shared CSS components.
- Do not add accounts, cloud sync, social features, or telemetry unless explicitly requested.
- Agentic GitHub workflows: follow `.github/instructions/agentic-workflows.instructions.md` for `.github/workflows/*.md`.

## Tests and quality bar

- Run `npm test` after progress/catalog/markdown/link changes.
- Existing coverage includes achievements, catalog, link mapper, markdown renderer.
- UI is mostly visual; validate with F5 or packaged Insiders install for webview/layout work.

## When changing UI

1. Update shared styles in `webviewHtml.ts` first when the pattern is reusable.
2. Keep course theming centralized in `courseTheme.ts`.
3. Preserve accessibility: focus rings (`--vscode-focusBorder`), labels + icons (not color alone), reduced motion.
4. Re-package **with dependencies** and reinstall when the user is testing via Insiders VSIX.
