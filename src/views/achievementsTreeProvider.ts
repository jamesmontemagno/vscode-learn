import * as vscode from 'vscode';
import type { ProgressStore } from '../progress/progressStore';
import type { AchievementDefinition } from '../progress/types';
import { achievementCategories, getAchievementCategory } from './courseTheme';

type AchievementNode = CategoryNode | AchievementItemNode;

interface CategoryNode {
  readonly kind: 'category';
  readonly category: AchievementDefinition['category'];
}

interface AchievementItemNode {
  readonly kind: 'achievement';
  readonly id: string;
}

export class AchievementsTreeProvider implements vscode.TreeDataProvider<AchievementNode> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly extensionUri: vscode.Uri, private readonly progressStore: ProgressStore) {
    progressStore.onDidChangeProgress(() => this.changeEmitter.fire());
  }

  getTreeItem(element: AchievementNode): vscode.TreeItem {
    if (element.kind === 'category') {
      const meta = getAchievementCategory(element.category);
      const items = this.progressStore.getEarnedAchievements().filter(entry => entry.definition.category === element.category);
      const earned = items.filter(entry => entry.earned).length;
      const treeItem = new vscode.TreeItem(`${meta.title} (${earned}/${items.length})`, vscode.TreeItemCollapsibleState.Expanded);
      treeItem.iconPath = new vscode.ThemeIcon(meta.icon);
      treeItem.contextValue = 'achievementCategory';
      treeItem.tooltip = `${meta.title} achievements`;
      return treeItem;
    }

    const item = this.progressStore.getEarnedAchievements().find(entry => entry.definition.id === element.id);
    if (!item) {
      return new vscode.TreeItem(element.id);
    }

    const treeItem = new vscode.TreeItem(item.definition.title, vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.earned ? 'Unlocked' : 'Locked';
    treeItem.tooltip = `${item.definition.description}\n\nHow to earn: ${item.definition.howToEarn}\nWhy it matters: ${item.definition.whyItMatters}`;
    treeItem.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', item.definition.badgeAsset);
    treeItem.command = {
      command: 'vscodeLearn.showAchievementInfo',
      title: 'Show achievement info',
      arguments: [item.definition.id]
    };
    treeItem.contextValue = item.earned ? 'achievementEarned' : 'achievementLocked';
    return treeItem;
  }

  getChildren(element?: AchievementNode): AchievementNode[] {
    if (!element) {
      return [...achievementCategories]
        .sort((left, right) => left.order - right.order)
        .map(category => ({ kind: 'category' as const, category: category.id }));
    }

    if (element.kind === 'category') {
      return this.progressStore.getEarnedAchievements()
        .filter(entry => entry.definition.category === element.category)
        .map(entry => ({ kind: 'achievement' as const, id: entry.definition.id }));
    }

    return [];
  }
}
