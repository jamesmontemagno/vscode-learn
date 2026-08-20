import assert from 'node:assert/strict';
import test from 'node:test';
import { generatedLearnCatalog } from '../../src/generated/learnCatalog.generated';
import { findLesson, getAllLessons } from '../../src/catalog/types';

test('generated catalog contains the discovered VS Code Learn courses and lessons', () => {
  assert.equal(generatedLearnCatalog.courses.length, 5);
  assert.equal(getAllLessons(generatedLearnCatalog).length, 26);
  assert.ok(findLesson(generatedLearnCatalog, 'java-spring-boot/1-build-and-run'));
  assert.ok(findLesson(generatedLearnCatalog, 'java-spring-boot/4-test-with-playwright'));
  assert.ok(findLesson(generatedLearnCatalog, 'foundry-toolkit-extension/1-get-started'));
  assert.ok(findLesson(generatedLearnCatalog, 'foundations/introduction-to-agent-first-development'));
  assert.ok(findLesson(generatedLearnCatalog, 'customizations/8-demo'));
  assert.ok(findLesson(generatedLearnCatalog, 'agents/4-using-third-party-agents-in-vs-code'));
});

test('lesson ids are unique', () => {
  const lessonIds = getAllLessons(generatedLearnCatalog).map(lesson => lesson.id);
  assert.equal(new Set(lessonIds).size, lessonIds.length);
});
