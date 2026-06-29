import * as vscode from 'vscode';
import type { ProgressStore } from '../progress/progressStore';

export class HistoryTreeProvider implements vscode.TreeDataProvider<string> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly progressStore: ProgressStore) {
    progressStore.onDidChangeProgress(() => this.changeEmitter.fire());
  }

  getTreeItem(id: string): vscode.TreeItem {
    const event = this.progressStore.getState().history.find(item => item.id === id);
    const treeItem = new vscode.TreeItem(event?.message ?? id, vscode.TreeItemCollapsibleState.None);
    treeItem.description = event ? new Date(event.at).toLocaleString() : undefined;
    treeItem.iconPath = new vscode.ThemeIcon(event?.type === 'achievementUnlocked' ? 'trophy' : 'history');
    return treeItem;
  }

  getChildren(): string[] {
    return this.progressStore.getState().history.map(event => event.id);
  }
}
