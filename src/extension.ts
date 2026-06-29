import * as vscode from 'vscode';
import { CatalogProvider } from './catalog/catalogProvider';
import { LessonContentService } from './content/lessonContentService';
import { registerCommands } from './commands/commandRegistrations';
import { ProgressStore } from './progress/progressStore';
import { AchievementInfoPanel } from './views/achievementInfoPanel';
import { AchievementsTreeProvider } from './views/achievementsTreeProvider';
import { DashboardPanel } from './views/dashboardPanel';
import { HistoryTreeProvider } from './views/historyTreeProvider';
import { LearnTreeProvider } from './views/learnTreeProvider';
import { LessonReaderPanel } from './views/lessonReaderPanel';

export function activate(context: vscode.ExtensionContext): void {
  const catalogProvider = new CatalogProvider(context);
  const progressStore = new ProgressStore(context, () => catalogProvider.getCatalog());
  const contentService = new LessonContentService(context);

  const learnTreeProvider = new LearnTreeProvider(catalogProvider, progressStore);
  const achievementsTreeProvider = new AchievementsTreeProvider(context.extensionUri, progressStore);
  const historyTreeProvider = new HistoryTreeProvider(progressStore);
  const dashboardPanel = new DashboardPanel(context.extensionUri, catalogProvider, progressStore);
  const achievementInfoPanel = new AchievementInfoPanel(context.extensionUri, progressStore);
  const lessonReaderPanel = new LessonReaderPanel(catalogProvider, contentService, progressStore);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('vscodeLearn.courses', learnTreeProvider),
    vscode.window.registerTreeDataProvider('vscodeLearn.achievements', achievementsTreeProvider),
    vscode.window.registerTreeDataProvider('vscodeLearn.history', historyTreeProvider)
  );

  registerCommands(context, catalogProvider, progressStore, dashboardPanel, lessonReaderPanel, achievementInfoPanel);

  void catalogProvider.refreshIfDue();
}

export function deactivate(): void {}
