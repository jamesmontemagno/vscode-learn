import * as vscode from 'vscode';
import type { LearnCourse } from '../catalog/types';
import type { AchievementDefinition } from '../progress/types';

export type CourseThemeId = 'foundations' | 'customizations' | 'agents' | 'default';

export interface CourseTheme {
  readonly id: CourseThemeId;
  readonly accentVar: string;
  readonly icon: string;
  readonly label: string;
}

const courseThemes: Record<string, CourseTheme> = {
  foundations: {
    id: 'foundations',
    accentVar: 'var(--vscode-charts-blue)',
    icon: 'layers',
    label: 'Foundations'
  },
  customizations: {
    id: 'customizations',
    accentVar: 'var(--vscode-charts-purple)',
    icon: 'paintcan',
    label: 'Customizations'
  },
  agents: {
    id: 'agents',
    accentVar: 'var(--vscode-charts-green)',
    icon: 'extensions',
    label: 'Extensions'
  }
};

const defaultTheme: CourseTheme = {
  id: 'default',
  accentVar: 'var(--vscode-charts-orange)',
  icon: 'book',
  label: 'Course'
};

export function getCourseTheme(courseOrId: Pick<LearnCourse, 'id'> | string): CourseTheme {
  const id = typeof courseOrId === 'string' ? courseOrId : courseOrId.id;
  return courseThemes[id] ?? defaultTheme;
}

export function getCourseThemeIcon(courseOrId: Pick<LearnCourse, 'id'> | string): vscode.ThemeIcon {
  return new vscode.ThemeIcon(getCourseTheme(courseOrId).icon);
}

export function courseThemeClass(courseOrId: Pick<LearnCourse, 'id'> | string): string {
  return `course-${getCourseTheme(courseOrId).id}`;
}

export interface AchievementCategoryMeta {
  readonly id: AchievementDefinition['category'];
  readonly title: string;
  readonly icon: string;
  readonly order: number;
}

export const achievementCategories: readonly AchievementCategoryMeta[] = [
  { id: 'gettingStarted', title: 'Getting Started', icon: 'rocket', order: 0 },
  { id: 'courseMastery', title: 'Course Mastery', icon: 'mortar-board', order: 1 },
  { id: 'streaks', title: 'Streaks', icon: 'flame', order: 2 },
  { id: 'completion', title: 'Completion', icon: 'trophy', order: 3 }
];

export function getAchievementCategory(category: AchievementDefinition['category']): AchievementCategoryMeta {
  return achievementCategories.find(item => item.id === category) ?? achievementCategories[0];
}

export function progressRingSvg(percent: number, size = 56, stroke = 5): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return `<svg class="vl-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
  <circle class="vl-ring-track" cx="${center}" cy="${center}" r="${radius}" stroke-width="${stroke}" />
  <circle class="vl-ring-value" cx="${center}" cy="${center}" r="${radius}" stroke-width="${stroke}"
    stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" />
</svg>`;
}

export function formatLessonStatus(status: 'notStarted' | 'inProgress' | 'completed'): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'inProgress':
      return 'In progress';
    default:
      return 'Not started';
  }
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function historyGroupLabel(iso: string, now = new Date()): string {
  const eventDay = dayKey(iso);
  const today = dayKey(now.toISOString());
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = dayKey(yesterdayDate.toISOString());

  if (eventDay === today) {
    return 'Today';
  }
  if (eventDay === yesterday) {
    return 'Yesterday';
  }

  const eventDate = new Date(`${eventDay}T00:00:00`);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  if (eventDate >= new Date(`${dayKey(weekAgo.toISOString())}T00:00:00`)) {
    return 'Earlier this week';
  }

  return eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
