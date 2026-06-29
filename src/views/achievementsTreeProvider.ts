import * as vscode from 'vscode';
import type { ProgressStore } from '../progress/progressStore';

export class AchievementsTreeProvider implements vscode.TreeDataProvider<string> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly progressStore: ProgressStore) {
    progressStore.onDidChangeProgress(() => this.changeEmitter.fire());
  }

  getTreeItem(id: string): vscode.TreeItem {
    const item = this.progressStore.getEarnedAchievements().find(entry => entry.definition.id === id);
    if (!item) {
      return new vscode.TreeItem(id);
    }
    const treeItem = new vscode.TreeItem(item.definition.title, vscode.TreeItemCollapsibleState.None);
    treeItem.description = item.earned ? 'earned' : 'locked';
    treeItem.tooltip = item.definition.description;
    treeItem.iconPath = new vscode.ThemeIcon(item.earned ? 'trophy' : 'lock');
    return treeItem;
  }

  getChildren(): string[] {
    return this.progressStore.getEarnedAchievements().map(entry => entry.definition.id);
  }
}
