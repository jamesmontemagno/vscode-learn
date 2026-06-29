import * as vscode from 'vscode';
import type { LearnCatalog, LearnLesson } from '../catalog/types';
import { achievementDefinitions, evaluateAchievements } from './achievements';
import type { HistoryEvent, LessonProgress, ProgressState } from './types';

const progressKey = 'vscodeLearn.progressState';
const schemaVersion = 1;

export class ProgressStore {
  private readonly changeEmitter = new vscode.EventEmitter<ProgressState>();
  readonly onDidChangeProgress = this.changeEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext, private readonly getCatalog: () => LearnCatalog) {}

  getState(): ProgressState {
    return migrateState(this.context.globalState.get<ProgressState>(progressKey));
  }

  getLessonProgress(lessonId: string): LessonProgress {
    return this.getState().lessons[lessonId] ?? { status: 'notStarted', completionCount: 0 };
  }

  async markLessonStarted(lesson: LearnLesson): Promise<void> {
    const state = this.getState();
    const existing = state.lessons[lesson.id] ?? { status: 'notStarted', completionCount: 0 };
    const now = new Date().toISOString();
    const updated: ProgressState = {
      ...state,
      lessons: {
        ...state.lessons,
        [lesson.id]: {
          ...existing,
          status: existing.status === 'completed' ? 'completed' : 'inProgress',
          startedAt: existing.startedAt ?? now,
          lastOpenedAt: now
        }
      },
      history: existing.status === 'notStarted'
        ? addHistory(state.history, 'lessonStarted', lesson.id, `Started ${lesson.title}`)
        : state.history
    };
    await this.save(updated);
  }

  async markLessonComplete(lesson: LearnLesson): Promise<void> {
    const state = this.getState();
    const existing = state.lessons[lesson.id] ?? { status: 'notStarted', completionCount: 0 };
    const now = new Date().toISOString();
    let updated: ProgressState = {
      ...state,
      lessons: {
        ...state.lessons,
        [lesson.id]: {
          ...existing,
          status: 'completed',
          startedAt: existing.startedAt ?? now,
          completedAt: now,
          lastOpenedAt: now,
          completionCount: existing.completionCount + (existing.status === 'completed' ? 0 : 1)
        }
      },
      history: existing.status === 'completed' ? state.history : addHistory(state.history, 'lessonCompleted', lesson.id, `Completed ${lesson.title}`)
    };

    const unlocked = evaluateAchievements(this.getCatalog(), updated);
    if (unlocked.length > 0) {
      const achievements = { ...updated.achievements };
      let history = updated.history;
      for (const achievement of unlocked) {
        achievements[achievement.id] = { unlockedAt: now, triggeringLessonId: lesson.id };
        history = addHistory(history, 'achievementUnlocked', lesson.id, `Unlocked ${achievement.title}`, achievement.id);
      }
      updated = { ...updated, achievements, history };
      vscode.window.showInformationMessage(`Achievement unlocked: ${unlocked.map(item => item.title).join(', ')}`);
    }

    await this.save(updated);
  }

  async resetLesson(lesson: LearnLesson): Promise<void> {
    const state = this.getState();
    const lessons = { ...state.lessons };
    delete lessons[lesson.id];
    await this.save({
      ...state,
      lessons,
      history: addHistory(state.history, 'lessonReset', lesson.id, `Reset ${lesson.title}`)
    });
  }

  async resetAll(): Promise<void> {
    await this.save(emptyState());
  }

  getEarnedAchievements() {
    const state = this.getState();
    return achievementDefinitions.map(definition => ({
      definition,
      earned: state.achievements[definition.id]
    }));
  }

  private async save(state: ProgressState): Promise<void> {
    await this.context.globalState.update(progressKey, state);
    this.changeEmitter.fire(state);
  }
}

function migrateState(state: ProgressState | undefined): ProgressState {
  if (!state || state.schemaVersion !== schemaVersion) {
    return emptyState();
  }
  return state;
}

function emptyState(): ProgressState {
  return {
    schemaVersion,
    lessons: {},
    achievements: {},
    history: []
  };
}

function addHistory(history: readonly HistoryEvent[], type: HistoryEvent['type'], lessonId: string | undefined, message: string, achievementId?: string): HistoryEvent[] {
  return [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      at: new Date().toISOString(),
      lessonId,
      achievementId,
      message
    },
    ...history
  ].slice(0, 200);
}
