import assert from 'node:assert/strict';
import test from 'node:test';
import { generatedLearnCatalog } from '../../src/generated/learnCatalog.generated';
import { lessonIdFromLearnPath, resolveLearnLink, rewriteMarkdownAssetUrl } from '../../src/catalog/linkMapper';
import { findLesson } from '../../src/catalog/types';

test('maps learn paths to lesson ids', () => {
  assert.equal(lessonIdFromLearnPath('/learn/foundations/introduction-to-agent-first-development'), 'foundations/introduction-to-agent-first-development');
});

test('resolves known learn links to lessons', () => {
  const lesson = resolveLearnLink(generatedLearnCatalog, '/learn/agents/1-using-tools-with-agents');
  assert.equal(lesson?.id, 'agents/1-using-tools-with-agents');
});

test('rewrites relative image assets to raw GitHub URLs', () => {
  const lesson = findLesson(generatedLearnCatalog, 'agents/1-using-tools-with-agents');
  assert.ok(lesson);
  assert.equal(
    rewriteMarkdownAssetUrl(lesson, '../images/example.png'),
    'https://github.com/microsoft/vscode-docs/raw/refs/heads/main/learn/images/example.png'
  );
});
