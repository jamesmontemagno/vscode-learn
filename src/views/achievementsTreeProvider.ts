import * as vscode from 'vscode';
import type { ProgressStore } from '../progress/progressStore';

export class AchievementsTreeProvider implements vscode.TreeDataProvider<string> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly extensionUri: vscode.Uri, private readonly progressStore: ProgressStore) {
    progressStore.onDidChangeProgress(() => this.changeEmitter.fire());
  }

  getTreeItem(id: string): vscode.TreeItem {
    const item = this.progressStore.getEarnedAchievements().find(entry => entry.definition.id === id);
    if (!item) {
      return new vscode.TreeItem(id);
    }
    const treeItem = new vscode.TreeItem(item.definition.title, vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.earned ? 'earned' : 'locked';
    treeItem.tooltip = `${item.definition.description}\n\nHow to earn: ${item.definition.howToEarn}\nWhy it matters: ${item.definition.whyItMatters}`;
    treeItem.iconPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', item.definition.badgeAsset);
    treeItem.command = {
      command: 'vscodeLearn.showAchievementInfo',
      title: 'Show achievement info',
      arguments: [item.definition.id]
    };
    return treeItem;
  }

  getChildren(): string[] {
    return this.progressStore.getEarnedAchievements().map(entry => entry.definition.id);
  }
}
