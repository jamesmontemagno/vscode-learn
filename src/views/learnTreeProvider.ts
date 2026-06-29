import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import type { LearnCourse, LearnLesson } from '../catalog/types';
import type { ProgressStore } from '../progress/progressStore';

type LearnNode = CourseNode | LessonNode;

interface CourseNode {
  readonly kind: 'course';
  readonly course: LearnCourse;
}

export interface LessonNode {
  readonly kind: 'lesson';
  readonly lesson: LearnLesson;
}

export class LearnTreeProvider implements vscode.TreeDataProvider<LearnNode> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private readonly catalogProvider: CatalogProvider, private readonly progressStore: ProgressStore) {
    catalogProvider.onDidChangeCatalog(() => this.refresh());
    progressStore.onDidChangeProgress(() => this.refresh());
  }

  refresh(): void {
    this.changeEmitter.fire();
  }

  getTreeItem(element: LearnNode): vscode.TreeItem {
    if (element.kind === 'course') {
      const total = element.course.lessons.length;
      const completed = element.course.lessons.filter(lesson => this.progressStore.getLessonProgress(lesson.id).status === 'completed').length;
      const item = new vscode.TreeItem(`${element.course.title} (${completed}/${total})`, vscode.TreeItemCollapsibleState.Expanded);
      item.description = `${Math.round((completed / total) * 100)}%`;
      item.iconPath = new vscode.ThemeIcon('book');
      return item;
    }

    const progress = this.progressStore.getLessonProgress(element.lesson.id);
    const item = new vscode.TreeItem(element.lesson.title, vscode.TreeItemCollapsibleState.None);
    item.contextValue = 'lesson';
    item.command = {
      command: 'vscodeLearn.openLesson',
      title: 'Open Lesson',
      arguments: [element.lesson.id]
    };
    item.description = progress.status === 'notStarted' ? undefined : progress.status;
    item.iconPath = new vscode.ThemeIcon(progress.status === 'completed' ? 'pass-filled' : progress.status === 'inProgress' ? 'play-circle' : 'circle-large-outline');
    return item;
  }

  getChildren(element?: LearnNode): LearnNode[] {
    if (!element) {
      return this.catalogProvider.getCatalog().courses.map(course => ({ kind: 'course', course }));
    }
    return element.kind === 'course' ? element.course.lessons.map(lesson => ({ kind: 'lesson', lesson })) : [];
  }
}
