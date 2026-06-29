# Plan: VS Code Learn Gamification Extension

## Problem and proposed approach

Create a new TypeScript VS Code extension that gamifies the VS Code Learn courses. The extension will use the public `microsoft/vscode-docs` repository as the source of truth for course metadata and Markdown lesson content, render lessons inside VS Code in an embedded reader, track local progress/history, and award achievements.

MVP direction confirmed:
- Local-first progress and achievement storage.
- Embedded reader for lesson content.
- Source data from `https://github.com/microsoft/vscode-docs/tree/main/learn`.
- No account sign-in, cloud sync, social features, or telemetry in the MVP.

## Data source strategy

### Source of truth

Use the public docs repository instead of scraping rendered web pages:

- Catalog:
  - `https://raw.githubusercontent.com/microsoft/vscode-docs/main/learn/toc.json`
  - Contains course names, course areas, descriptions, and ordered topic URL paths.
- Lesson Markdown:
  - `https://raw.githubusercontent.com/microsoft/vscode-docs/main/learn/{area}/{slug}.md`
  - Derived from each `toc.json` topic path.
- GitHub contents metadata:
  - `https://api.github.com/repos/microsoft/vscode-docs/contents/learn?ref=main`
  - Used for optional SHA/ETag-based sync checks.

Current catalog discovered:
- Agent Foundations: 6 lessons.
- Agent Customizations: 8 lessons.
- Agent Extensions: 4 lessons.

### Local generated catalog

Include a generated static fallback catalog in the extension bundle so the extension works offline on first launch:

```text
src/generated/learnCatalog.generated.ts
```

This file will contain:
- course id, title, description, order
- lesson id, title, area, slug, canonical URL, raw Markdown URL
- source path and optional source SHA
- generated timestamp/version metadata

Generation command:

```text
npm run generate:catalog
```

Implementation:
- `scripts/generateCatalog.ts`
- Fetches `learn/toc.json`.
- Validates each topic path maps to a Markdown file.
- Optionally fetches GitHub contents metadata to attach SHA values.
- Emits a deterministic TypeScript catalog module.
- Fails loudly on malformed paths, duplicate lesson ids, missing titles, or unreachable source files.

## Sync and caching strategy

### Runtime sync behavior

Default sync policy:
- On activation, check for catalog updates at most once every 24 hours.
- Do not block extension activation on network calls.
- Provide a manual command: `VS Code Learn: Refresh Course Catalog`.
- Provide a setting to change or disable automatic checks:
  - `vscodeLearn.sync.enabled` default `true`
  - `vscodeLearn.sync.intervalHours` default `24`
  - `vscodeLearn.sync.branch` default `main`

### What sync updates

Sync updates only course metadata and cached lesson Markdown:
- Fetch `learn/toc.json`.
- Compare ETag/hash/version with the stored catalog metadata.
- Update the in-memory catalog for the current session.
- Persist the remote catalog manifest in `globalStorageUri`.
- Keep the bundled generated catalog as fallback.

### Lesson content cache

Lesson content should be fetched on demand:
- First open of a lesson fetches raw Markdown from GitHub.
- Cache Markdown in `ExtensionContext.globalStorageUri/content/{lessonId}.md`.
- Store per-lesson metadata in `globalState`:
  - ETag or SHA
  - last fetched timestamp
  - source URL
  - content version
- Revalidate cached content when:
  - the user opens a lesson and cached content is older than the sync interval, or
  - the user runs manual refresh.

Failure behavior:
- If live fetch fails and cached content exists, show cached content with a visible "cached" indicator.
- If live fetch fails and no cached content exists, show an explicit error with actions to retry or open the canonical web page.
- Do not silently mark lessons complete or suppress sync errors.

### Image and asset handling

For MVP:
- Render Markdown images as remote HTTPS images from the official docs/GitHub raw sources.
- Use a strict webview Content Security Policy allowing:
  - `img-src` for `https://raw.githubusercontent.com`, `https://code.visualstudio.com`, `data:`, and webview local resources.
  - no arbitrary scripts from remote sources.
- Convert relative Markdown image links to absolute official source URLs.

Later enhancement:
- Add optional image caching into `globalStorageUri/assets`.

## Embedded reader design

### Reader webview

Add a `LessonReaderPanel` webview that:
- Renders Markdown lesson content to sanitized HTML.
- Uses VS Code theme variables for styling.
- Shows course/lesson title, progress state, reading progress, and achievement toasts.
- Includes actions:
  - Start lesson
  - Mark in progress
  - Mark complete
  - Reopen official web page
  - Next lesson
  - Previous lesson
  - Refresh content

Markdown pipeline:
- Fetch raw Markdown from cache/source.
- Strip or normalize frontmatter if present.
- Render with `markdown-it` with raw HTML disabled.
- Sanitize rendered HTML.
- Rewrite links:
  - `/learn/...` links open inside the extension when they map to known lessons.
  - external links use `vscode.env.openExternal`.
  - relative docs/image links become absolute official URLs.

### Completion model

Do not infer completion from scroll alone. Use explicit user action:
- Opening a lesson sets status to `inProgress` if it was `notStarted`.
- "Mark complete" records completion timestamp and history event.
- Optional setting later can enable auto-prompt when scrolled near the end.

## VS Code views and UX

### Activity Bar container

Contribute a new Activity Bar container, for example `VS Code Learn`.

Views:
1. Courses
   - Course nodes with percentage complete.
   - Lesson nodes with status icons.
   - Context actions: open reader, mark complete, reset lesson.
2. Achievements
   - Earned and locked achievements.
   - Group by category: getting started, streaks, course mastery, completion.
3. History
   - Recent events: lesson started, completed, achievement unlocked, catalog refreshed.

### Dashboard webview

Add a `DashboardPanel` webview:
- Overall progress summary.
- Course cards with completion percentages.
- Continue learning card.
- Recent activity timeline.
- Achievement showcase.
- Streak/current momentum.
- Buttons for refresh, reset, open next lesson, and view all achievements.

### Commands

Register commands:
- `vscodeLearn.showDashboard`
- `vscodeLearn.openLesson`
- `vscodeLearn.openOfficialPage`
- `vscodeLearn.markLessonStarted`
- `vscodeLearn.markLessonComplete`
- `vscodeLearn.resetLessonProgress`
- `vscodeLearn.resetAllProgress`
- `vscodeLearn.refreshCatalog`
- `vscodeLearn.showAchievements`

Safety:
- Reset-all must require confirmation.
- Refresh should report source errors clearly.

## Progress, history, and achievements

### Storage

Use `ExtensionContext.globalState` for small state:
- schema version
- per-lesson progress
- earned achievements
- user preferences that are extension-state-specific
- history event index
- sync metadata

Use `ExtensionContext.globalStorageUri` for larger cached artifacts:
- remote catalog manifest
- Markdown lesson cache
- optional future image cache

State shape:

```ts
type LessonStatus = 'notStarted' | 'inProgress' | 'completed';

interface ProgressState {
  schemaVersion: number;
  lessons: Record<string, {
    status: LessonStatus;
    startedAt?: string;
    completedAt?: string;
    lastOpenedAt?: string;
    completionCount: number;
  }>;
  achievements: Record<string, {
    unlockedAt: string;
    triggeringLessonId?: string;
  }>;
  history: HistoryEvent[];
  sync: SyncState;
}
```

### Achievements

Initial achievement set:
- First Steps: complete the first lesson.
- Course Starter: start one lesson in each course.
- Course Finisher: complete one full course.
- Agent Foundations Master: complete all Agent Foundations lessons.
- Customization Master: complete all Agent Customizations lessons.
- Agent Extensions Master: complete all Agent Extensions lessons.
- Completionist: complete every known lesson.
- Momentum: complete lessons on 2 distinct days.
- Streak Builder: complete lessons on 3 consecutive days.
- Comeback: complete a lesson after a gap.

Achievement evaluation:
- Run after every progress-changing event.
- Deterministic, pure functions over catalog + progress state.
- Tests cover unlocked/not-unlocked boundary cases.

## Project structure

```text
/
  package.json
  tsconfig.json
  .vscode/
    launch.json
    tasks.json
    extensions.json
  scripts/
    generateCatalog.ts
  src/
    extension.ts
    generated/
      learnCatalog.generated.ts
    catalog/
      catalogProvider.ts
      githubDocsSource.ts
      linkMapper.ts
      types.ts
    content/
      contentCache.ts
      markdownRenderer.ts
      lessonContentService.ts
    progress/
      progressStore.ts
      achievements.ts
      history.ts
      types.ts
    views/
      learnTreeProvider.ts
      achievementsTreeProvider.ts
      historyTreeProvider.ts
      dashboardPanel.ts
      lessonReaderPanel.ts
      webviewHtml.ts
    commands/
      commandRegistrations.ts
  test/
    suite/
      achievements.test.ts
      catalogProvider.test.ts
      contentCache.test.ts
      linkMapper.test.ts
      progressStore.test.ts
```

## Implementation todos

1. Scaffold the TypeScript VS Code extension project with package metadata, build/test scripts, VS Code launch/tasks config, and baseline source/test folders.
2. Build the catalog generation pipeline from `microsoft/vscode-docs/learn/toc.json` and Markdown paths.
3. Implement catalog provider logic that merges bundled catalog fallback, persisted remote manifest, and optional live refresh.
4. Implement GitHub docs source and sync metadata handling with interval checks, manual refresh, explicit errors, and cached fallback behavior.
5. Implement lesson content cache and Markdown rendering pipeline for embedded webview reading.
6. Implement progress store, history event model, migrations, and reset operations.
7. Implement achievement definitions and deterministic unlock engine.
8. Implement Course, Achievement, and History tree views in the Activity Bar container.
9. Implement Dashboard webview.
10. Implement Lesson Reader webview with navigation, progress actions, link rewriting, and content refresh.
11. Register all commands and contribution points in `package.json`.
12. Add tests for catalog generation/provider behavior, link rewriting, cache fallback, progress updates, and achievements.
13. Validate install/build/test/debug workflows.
14. Document data source, sync cadence, cache behavior, reader behavior, and development commands in README.

## Validation plan

- Run dependency install after scaffolding.
- Run TypeScript compile.
- Run unit tests.
- Run extension test suite if scaffolded.
- Manually launch Extension Development Host and verify:
  - Activity Bar appears.
  - Courses load from bundled catalog.
  - A lesson opens in the embedded reader.
  - Content fetches/caches from GitHub raw Markdown.
  - Mark-complete updates tree, dashboard, history, and achievements.
  - Manual refresh works.
  - Offline/cached fallback shows a clear cached-content state.

## Open considerations

- Confirm extension name/display name before publishing.
- Decide whether to include an optional setting for automatic "mark complete" prompts after reading to the end.
- If publishing publicly, review licensing/attribution requirements for embedding Markdown content from the docs repository and include appropriate attribution in the reader/About view.
