export type LessonStatus = 'notStarted' | 'inProgress' | 'completed';

export interface LessonProgress {
  readonly status: LessonStatus;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly lastOpenedAt?: string;
  readonly completionCount: number;
}

export type HistoryEventType = 'lessonStarted' | 'lessonCompleted' | 'lessonReset' | 'achievementUnlocked' | 'catalogRefreshed';

export interface HistoryEvent {
  readonly id: string;
  readonly type: HistoryEventType;
  readonly at: string;
  readonly lessonId?: string;
  readonly achievementId?: string;
  readonly message: string;
}

export interface EarnedAchievement {
  readonly unlockedAt: string;
  readonly triggeringLessonId?: string;
}

export interface ProgressState {
  readonly schemaVersion: number;
  readonly lessons: Record<string, LessonProgress>;
  readonly achievements: Record<string, EarnedAchievement>;
  readonly history: readonly HistoryEvent[];
}

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badge: string;
  readonly badgeAsset: string;
  readonly howToEarn: string;
  readonly whyItMatters: string;
  readonly category: 'gettingStarted' | 'streaks' | 'courseMastery' | 'completion';
}
