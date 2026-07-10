---
applyTo: ".github/workflows/*.md"
---

# Agentic workflow instructions

This repository uses [GitHub Agentic Workflows](https://github.github.com/gh-aw/) (`gh-aw`) for agent-driven repository automation. Do not replace agentic workflows with hand-written scheduled GitHub Actions unless the user explicitly asks for a non-agentic workflow.

## Source and generated files

- Author agentic workflows as Markdown source files in `.github/workflows/*.md`.
- Compile each Markdown workflow with `gh aw compile`.
- Commit both the Markdown source and the generated `.github/workflows/*.lock.yml` file.
- Treat `.lock.yml` files as generated output. Do not edit them by hand.
- Keep `.github/aw/actions-lock.json` and `.gitattributes` changes produced by `gh aw compile` when they are part of the generated workflow state.

## Creating a new workflow

1. Install the official extension if needed: `gh extension install github/gh-aw`.
2. Create a workflow source file with `gh aw new <workflow-id> --engine copilot`.
3. Replace the template body with clear natural-language instructions for the agent.
4. Use scoped read permissions in frontmatter. Write actions should be declared through `safe-outputs`, not broad workflow permissions.
5. Include only the safe outputs the workflow actually needs, such as `create-issue`, `add-labels`, `assign-to-agent`, `create-agent-session`, or `noop`.
6. Compile with `gh aw compile <workflow-id> --approve --no-check-update`.
7. Run the repository's existing validation when the workflow change can affect code or generated behavior.

## Updating an existing workflow

- Edit the `.md` source file first.
- Recompile with `gh aw compile <workflow-id> --approve --no-check-update`.
- Review the generated `.lock.yml` diff for unexpected permission, secret, action, container, or schedule changes.
- Keep the workflow prompt specific enough that the agent can decide when to do nothing.
- Preserve deduplication requirements for workflows that create issues or PRs.

## Weekly lesson sync workflow

The weekly lesson sync workflow is `.github/workflows/lesson-sync-agent.md`.

Its purpose is to compare the official VS Code Learn catalog with `src/generated/learnCatalog.generated.ts` and create one weekly summary issue for every run. Each summary issue should mention `@JamesMontemagno`; the `create-issue` safe-output configuration should assign `JamesMontemagno` and apply the `lesson-sync` label directly, rather than asking the agent to emit separate assignment or label safe outputs for the summary issue. If new lessons exist, the issue should include deduplicated implementation details and start work through Copilot agent assignment or agent session creation. If there is no missing lesson content, the issue should clearly say no action is needed.
