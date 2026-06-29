import assert from 'node:assert/strict';
import test from 'node:test';
import { generatedLearnCatalog } from '../../src/generated/learnCatalog.generated';
import { evaluateAchievements } from '../../src/progress/achievements';
import type { ProgressState } from '../../src/progress/types';

test('unlocks first steps after one completed lesson', () => {
  const state: ProgressState = {
    schemaVersion: 1,
    lessons: {
      'agents/1-using-tools-with-agents': {
        status: 'completed',
        completionCount: 1,
        completedAt: '2026-06-29T00:00:00.000Z'
      }
    },
    achievements: {},
    history: []
  };

  const unlocked = evaluateAchievements(generatedLearnCatalog, state).map(item => item.id);
  assert.ok(unlocked.includes('first-steps'));
});

test('unlocks completionist when all lessons are completed', () => {
  const lessons = Object.fromEntries(generatedLearnCatalog.courses.flatMap(course => course.lessons).map(lesson => [
    lesson.id,
    {
      status: 'completed' as const,
      completionCount: 1,
      completedAt: '2026-06-29T00:00:00.000Z'
    }
  ]));

  const state: ProgressState = { schemaVersion: 1, lessons, achievements: {}, history: [] };
  const unlocked = evaluateAchievements(generatedLearnCatalog, state).map(item => item.id);
  assert.ok(unlocked.includes('completionist'));
  assert.ok(unlocked.includes('course-finisher'));
});
