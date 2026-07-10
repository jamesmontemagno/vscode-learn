---
on:
  workflow_dispatch:
  schedule: weekly on sunday

permissions:
  contents: read
  issues: read
  pull-requests: read

engine: copilot

tools:
  github:
    toolsets: [default]

network: defaults

safe-outputs:
  create-issue:
    max: 1
    labels: [lesson-sync]
    assignees: [JamesMontemagno]
  assign-to-agent:
    max: 1
  create-agent-session:
    max: 1
---

# Weekly VS Code Learn lesson sync

Check whether the official VS Code Learn site has new lessons that are not yet represented in this extension, then post a weekly summary issue so maintainers know the sync ran.

## Sources to compare

1. Fetch the official VS Code Learn catalog from `https://raw.githubusercontent.com/microsoft/vscode-docs/main/learn/toc.json`.
2. Inspect this repository's generated catalog in `src/generated/learnCatalog.generated.ts`.
3. Treat a lesson as already integrated when its `area/slug` id exists in the generated catalog.

## Required behavior

1. Compare the official catalog against the generated catalog.
2. Always create one weekly summary issue for the run, even when every official lesson is already represented.
3. Mention `@JamesMontemagno` in the issue body. The `create-issue` safe output is configured to label the issue with `lesson-sync` and assign it to `JamesMontemagno`.
4. Do not emit separate `add-labels` or `assign-to-user` safe outputs for the weekly summary issue.
5. If every official lesson is already represented, make the issue a concise status report that says no action is needed.
6. If one or more official lessons are missing, check open repository issues first so you do not create duplicate implementation work for a lesson that is already tracked.
7. If missing lessons are untracked, include them in the weekly summary issue and start implementation by assigning the issue to the GitHub Copilot coding agent with `assign-to-agent`. If this repository supports direct agent session creation, use `create-agent-session` for the new issue instead.

## Issue content

The weekly summary issue should include:

- `@JamesMontemagno` near the top so James is notified.
- The run date and a short summary of whether new VS Code Learn lessons were found.
- Counts for official lessons, integrated generated-catalog lessons, missing lessons, and missing lessons already tracked by open issues.
- If no new lessons are missing, a clear "No action needed" result.
- If missing lessons are found, each missing lesson title, id, canonical `https://code.visualstudio.com/learn/...` URL, and raw Markdown URL.
- If implementation is needed, guidance to run `npm run generate:catalog`, review any UI or documentation impact, and run `npm test`.
- If implementation is needed, acceptance criteria requiring the extension to expose the new lessons, lesson links to resolve correctly, and existing catalog/rendering tests to pass.

Avoid unrelated repository changes. The workflow should always create a weekly summary issue, but should only create follow-up implementation work when the official VS Code Learn catalog contains lessons missing from this extension.
