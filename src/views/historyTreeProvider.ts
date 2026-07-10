import * as vscode from 'vscode';
import { findAchievementDefinition } from '../progress/achievements';
import type { ProgressStore } from '../progress/progressStore';
import type { HistoryEvent } from '../progress/types';
import { historyGroupLabel } from './courseTheme';

type HistoryNode = GroupNode | EventNode;

interface GroupNode {
  readonly kind: 'group';
  readonly label: string;
  readonly eventIds: readonly string[];
}

interface EventNode {
  readonly kind: 'event';
  readonly id: string;
}

export class HistoryTreeProvider implements vscode.TreeDataProvider<HistoryNode> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly extensionUri: vscode.Uri, private readonly progressStore: ProgressStore) {
    progressStore.onDidChangeProgress(() => this.changeEmitter.fire());
  }

  getTreeItem(element: HistoryNode): vscode.TreeItem {
    if (element.kind === 'group') {
      const treeItem = new vscode.TreeItem(`${element.label} (${element.eventIds.length})`, vscode.TreeItemCollapsibleState.Expanded);
      treeItem.iconPath = new vscode.ThemeIcon('calendar');
      treeItem.contextValue = 'historyGroup';
      return treeItem;
    }

    const event = this.progressStore.getState().history.find(item => item.id === element.id);
    const treeItem = new vscode.TreeItem(event?.message ?? element.id, vscode.TreeItemCollapsibleState.None);
    treeItem.description = event ? new Date(event.at).toLocaleString() : undefined;
    treeItem.tooltip = event ? `${event.message}\n${new Date(event.at).toLocaleString()}` : undefined;
    treeItem.iconPath = this.iconForEvent(event);
    treeItem.contextValue = 'historyEvent';
    return treeItem;
  }

  getChildren(element?: HistoryNode): HistoryNode[] {
    const history = this.progressStore.getState().history;
    if (!element) {
      const groups = new Map<string, string[]>();
      for (const event of history) {
        const label = historyGroupLabel(event.at);
        const existing = groups.get(label) ?? [];
        existing.push(event.id);
        groups.set(label, existing);
      }

      return [...groups.entries()].map(([label, eventIds]) => ({
        kind: 'group' as const,
        label,
        eventIds
      }));
    }

    if (element.kind === 'group') {
      return element.eventIds.map(id => ({ kind: 'event' as const, id }));
    }

    return [];
  }

  private iconForEvent(event: HistoryEvent | undefined): vscode.ThemeIcon | vscode.Uri {
    if (!event) {
      return new vscode.ThemeIcon('history');
    }

    if (event.type === 'achievementUnlocked' && event.achievementId) {
      const achievement = findAchievementDefinition(event.achievementId);
      if (achievement) {
        return vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', achievement.badgeAsset);
      }
    }

    switch (event.type) {
      case 'lessonStarted':
        return new vscode.ThemeIcon('play');
      case 'lessonCompleted':
        return new vscode.ThemeIcon('check');
      case 'lessonReset':
        return new vscode.ThemeIcon('discard');
      case 'catalogRefreshed':
        return new vscode.ThemeIcon('sync');
      case 'achievementUnlocked':
        return new vscode.ThemeIcon('trophy');
      default:
        return new vscode.ThemeIcon('history');
    }
  }
}
