import assert from 'node:assert/strict';
import test from 'node:test';
import { generatedLearnCatalog } from '../../src/generated/learnCatalog.generated';
import { findLesson } from '../../src/catalog/types';
import { renderLessonMarkdown } from '../../src/content/markdownRenderer';

test('renders markdown and rewrites known learn links to command URIs', () => {
  const lesson = findLesson(generatedLearnCatalog, 'foundations/introduction-to-agent-first-development');
  assert.ok(lesson);

  const html = renderLessonMarkdown(generatedLearnCatalog, lesson, '[Next](/learn/agents/1-using-tools-with-agents)');
  assert.match(html, /command:vscodeLearn\.openLesson/);
});

test('does not render raw html from markdown', () => {
  const lesson = findLesson(generatedLearnCatalog, 'foundations/introduction-to-agent-first-development');
  assert.ok(lesson);

  const html = renderLessonMarkdown(generatedLearnCatalog, lesson, '<script>alert(1)</script>');
  assert.doesNotMatch(html, /<script>/);
});

test('renders youtube iframes as clickable thumbnail cards', () => {
  const lesson = findLesson(generatedLearnCatalog, 'foundations/introduction-to-agent-first-development');
  assert.ok(lesson);

  const markdown = '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?si=test"></iframe>';
  const html = renderLessonMarkdown(generatedLearnCatalog, lesson, markdown);
  assert.match(html, /command:vscodeLearn\.openVideo/);
  assert.match(html, /img\.youtube\.com\/vi\/dQw4w9WgXcQ\/hqdefault\.jpg/);
  assert.doesNotMatch(html, /<iframe/);
});

test('does not render non-youtube iframes', () => {
  const lesson = findLesson(generatedLearnCatalog, 'foundations/introduction-to-agent-first-development');
  assert.ok(lesson);

  const markdown = '<iframe src="https://example.com/embed/video"></iframe>';
  const html = renderLessonMarkdown(generatedLearnCatalog, lesson, markdown);
  assert.doesNotMatch(html, /video-card/);
  assert.match(html, /https:\/\/example\.com\/embed\/video/);
});
