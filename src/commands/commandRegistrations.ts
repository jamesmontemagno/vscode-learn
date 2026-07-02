import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import { findLesson } from '../catalog/types';
import type { LessonContentService } from '../content/lessonContentService';
import type { ProgressStore } from '../progress/progressStore';
import type { DashboardPanel } from '../views/dashboardPanel';
import type { LessonReaderPanel } from '../views/lessonReaderPanel';
import type { AchievementInfoPanel } from '../views/achievementInfoPanel';

export function registerCommands(
  context: vscode.ExtensionContext,
  catalogProvider: CatalogProvider,
  progressStore: ProgressStore,
  lessonContentService: LessonContentService,
  dashboardPanel: DashboardPanel,
  lessonReaderPanel: LessonReaderPanel,
  achievementInfoPanel: AchievementInfoPanel
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodeLearn.showDashboard', () => dashboardPanel.show()),
    vscode.commands.registerCommand('vscodeLearn.showAchievements', () => vscode.commands.executeCommand('vscodeLearn.achievements.focus')),
    vscode.commands.registerCommand('vscodeLearn.openVideo', async (url?: string) => {
      if (!url) {
        return;
      }
      await openInIntegratedBrowser(url);
    }),
    vscode.commands.registerCommand('vscodeLearn.openLesson', async (lessonId?: string) => {
      const selectedLessonId = lessonId ?? await pickLesson(catalogProvider);
      if (selectedLessonId) {
        await lessonReaderPanel.open(selectedLessonId);
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.openOfficialPage', async (lessonId?: string) => {
      const selectedLessonId = lessonId ?? await pickLesson(catalogProvider);
      if (!selectedLessonId) {
        return;
      }
      const lesson = findLesson(catalogProvider.getCatalog(), selectedLessonId);
      if (lesson) {
        await openInIntegratedBrowser(lesson.canonicalUrl);
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.openExternalLink', async (url?: string) => {
      if (!url) {
        return;
      }
      await openInIntegratedBrowser(url);
    }),
    vscode.commands.registerCommand('vscodeLearn.markLessonStarted', async (lessonId?: string) => {
      const selectedLessonId = lessonId ?? await pickLesson(catalogProvider);
      const lesson = selectedLessonId ? findLesson(catalogProvider.getCatalog(), selectedLessonId) : undefined;
      if (lesson) {
        await progressStore.markLessonStarted(lesson);
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.markLessonComplete', async (lessonId?: string) => {
      const selectedLessonId = lessonId ?? await pickLesson(catalogProvider);
      const lesson = selectedLessonId ? findLesson(catalogProvider.getCatalog(), selectedLessonId) : undefined;
      if (lesson) {
        await progressStore.markLessonComplete(lesson);
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.resetLessonProgress', async (lessonId?: string) => {
      const selectedLessonId = lessonId ?? await pickLesson(catalogProvider);
      const lesson = selectedLessonId ? findLesson(catalogProvider.getCatalog(), selectedLessonId) : undefined;
      if (lesson) {
        await progressStore.resetLesson(lesson);
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.resetAllProgress', async () => {
      const answer = await vscode.window.showWarningMessage('Reset all VS Code Learn progress and achievements?', { modal: true }, 'Reset');
      if (answer === 'Reset') {
        await progressStore.resetAll();
      }
    }),
    vscode.commands.registerCommand('vscodeLearn.resetAllData', async () => {
      const answer = await vscode.window.showWarningMessage(
        'Reset all VS Code Learn data? This clears progress, achievements, activity history, cached lessons, and cached catalog data.',
        { modal: true },
        'Reset Everything'
      );
      if (answer !== 'Reset Everything') {
        return;
      }

      await progressStore.resetAll();
      await lessonContentService.clearCachedContent();
      await catalogProvider.resetCachedCatalog();
      await lessonReaderPanel.refreshCurrent();
      await vscode.window.showInformationMessage('VS Code Learn data has been reset.');
    }),
    vscode.commands.registerCommand('vscodeLearn.refreshCatalog', async () => {
      await catalogProvider.refresh(true);
      await lessonReaderPanel.refreshCurrent();
    }),
    vscode.commands.registerCommand('vscodeLearn.showAchievementInfo', (achievementId?: string) => {
      if (!achievementId) {
        return;
      }
      achievementInfoPanel.show(achievementId);
    })
  );
}

async function pickLesson(catalogProvider: CatalogProvider): Promise<string | undefined> {
  const picks = catalogProvider.getCatalog().courses.flatMap(course => course.lessons.map(lesson => ({
    label: lesson.title,
    description: course.title,
    lessonId: lesson.id
  })));
  const picked = await vscode.window.showQuickPick(picks, { title: 'Open VS Code Learn lesson' });
  return picked?.lessonId;
}

async function openInIntegratedBrowser(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    await vscode.window.showErrorMessage(`Unable to open invalid URL: ${url}`);
    return;
  }

  if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
    await vscode.commands.executeCommand('simpleBrowser.show', parsed.toString());
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(parsed.toString()));
}
