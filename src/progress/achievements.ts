import type { LearnCatalog } from '../catalog/types';
import { getAllLessons } from '../catalog/types';
import type { AchievementDefinition, ProgressState } from './types';

export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first VS Code Learn lesson.',
    category: 'gettingStarted'
  },
  {
    id: 'course-starter',
    title: 'Course Starter',
    description: 'Start at least one lesson in every course.',
    category: 'gettingStarted'
  },
  {
    id: 'course-finisher',
    title: 'Course Finisher',
    description: 'Complete one full course.',
    category: 'courseMastery'
  },
  {
    id: 'foundations-master',
    title: 'Agent Foundations Master',
    description: 'Complete every Agent Foundations lesson.',
    category: 'courseMastery'
  },
  {
    id: 'customizations-master',
    title: 'Customization Master',
    description: 'Complete every Agent Customizations lesson.',
    category: 'courseMastery'
  },
  {
    id: 'agents-master',
    title: 'Agent Extensions Master',
    description: 'Complete every Agent Extensions lesson.',
    category: 'courseMastery'
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Complete every known VS Code Learn lesson.',
    category: 'completion'
  },
  {
    id: 'momentum',
    title: 'Momentum',
    description: 'Complete lessons on two distinct days.',
    category: 'streaks'
  },
  {
    id: 'streak-builder',
    title: 'Streak Builder',
    description: 'Complete lessons on three consecutive days.',
    category: 'streaks'
  },
  {
    id: 'comeback',
    title: 'Comeback',
    description: 'Complete a lesson after a break of at least seven days.',
    category: 'streaks'
  }
];

export function evaluateAchievements(catalog: LearnCatalog, state: ProgressState): AchievementDefinition[] {
  return achievementDefinitions.filter(definition => !state.achievements[definition.id] && isUnlocked(definition.id, catalog, state));
}

function isUnlocked(id: string, catalog: LearnCatalog, state: ProgressState): boolean {
  const completedLessonIds = completedLessons(state);
  const startedCourseIds = new Set(
    Object.entries(state.lessons)
      .filter(([, progress]) => progress.status !== 'notStarted')
      .map(([lessonId]) => lessonId.split('/')[0])
  );

  switch (id) {
    case 'first-steps':
      return completedLessonIds.size > 0;
    case 'course-starter':
      return catalog.courses.every(course => startedCourseIds.has(course.id));
    case 'course-finisher':
      return catalog.courses.some(course => course.lessons.every(lesson => completedLessonIds.has(lesson.id)));
    case 'foundations-master':
      return isCourseComplete(catalog, 'foundations', completedLessonIds);
    case 'customizations-master':
      return isCourseComplete(catalog, 'customizations', completedLessonIds);
    case 'agents-master':
      return isCourseComplete(catalog, 'agents', completedLessonIds);
    case 'completionist':
      return getAllLessons(catalog).every(lesson => completedLessonIds.has(lesson.id));
    case 'momentum':
      return distinctCompletionDays(state).length >= 2;
    case 'streak-builder':
      return hasConsecutiveCompletionDays(state, 3);
    case 'comeback':
      return hasComeback(state);
    default:
      return false;
  }
}

function completedLessons(state: ProgressState): Set<string> {
  return new Set(Object.entries(state.lessons).filter(([, progress]) => progress.status === 'completed').map(([lessonId]) => lessonId));
}

function isCourseComplete(catalog: LearnCatalog, courseId: string, completedLessonIds: Set<string>): boolean {
  const course = catalog.courses.find(item => item.id === courseId);
  return Boolean(course && course.lessons.every(lesson => completedLessonIds.has(lesson.id)));
}

function distinctCompletionDays(state: ProgressState): string[] {
  return [...new Set(Object.values(state.lessons).flatMap(progress => progress.completedAt ? [progress.completedAt.slice(0, 10)] : []))].sort();
}

function hasConsecutiveCompletionDays(state: ProgressState, requiredDays: number): boolean {
  const days = distinctCompletionDays(state).map(day => Date.parse(`${day}T00:00:00.000Z`));
  let streak = 1;
  for (let index = 1; index < days.length; index++) {
    const diffDays = (days[index] - days[index - 1]) / 86_400_000;
    streak = diffDays === 1 ? streak + 1 : 1;
    if (streak >= requiredDays) {
      return true;
    }
  }
  return false;
}

function hasComeback(state: ProgressState): boolean {
  const days = distinctCompletionDays(state).map(day => Date.parse(`${day}T00:00:00.000Z`));
  for (let index = 1; index < days.length; index++) {
    if ((days[index] - days[index - 1]) / 86_400_000 >= 7) {
      return true;
    }
  }
  return false;
}
