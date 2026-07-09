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
  add-labels:
    max: 2
  assign-to-agent:
    max: 1
  create-agent-session:
    max: 1
  noop:
---

# Weekly VS Code Learn lesson sync

Check whether the official VS Code Learn site has new lessons that are not yet represented in this extension, then create follow-up implementation work only when needed.

## Sources to compare

1. Fetch the official VS Code Learn catalog from `https://raw.githubusercontent.com/microsoft/vscode-docs/main/learn/toc.json`.
2. Inspect this repository's generated catalog in `src/generated/learnCatalog.generated.ts`.
3. Treat a lesson as already integrated when its `area/slug` id exists in the generated catalog.

## Required behavior

1. Compare the official catalog against the generated catalog.
2. If every official lesson is already represented, use the noop safe output and do not create an issue.
3. If one or more official lessons are missing, check open repository issues first so you do not create duplicate work for a lesson that is already tracked.
4. Create at most one issue for all newly detected, untracked lessons.
5. Label the issue with `lesson-sync`.
6. Start implementation by assigning the issue to the GitHub Copilot coding agent with `assign-to-agent`. If this repository supports direct agent session creation, use `create-agent-session` for the new issue instead.

## Issue content

The issue should include:

- A short summary explaining that new VS Code Learn lessons were found.
- Each missing lesson title, id, canonical `https://code.visualstudio.com/learn/...` URL, and raw Markdown URL.
- Implementation guidance to run `npm run generate:catalog`, review any UI or documentation impact, and run `npm test`.
- Acceptance criteria requiring the extension to expose the new lessons, lesson links to resolve correctly, and existing catalog/rendering tests to pass.

Avoid unrelated repository changes. The workflow should only create follow-up work when the official VS Code Learn catalog contains lessons missing from this extension.
