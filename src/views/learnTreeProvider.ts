import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import type { LearnCourse, LearnLesson } from '../catalog/types';
import type { ProgressStore } from '../progress/progressStore';
import { formatLessonStatus, getCourseThemeIcon } from './courseTheme';

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
      const percent = total ? Math.round((completed / total) * 100) : 0;
      const item = new vscode.TreeItem(`${element.course.title}`, vscode.TreeItemCollapsibleState.Expanded);
      item.description = `${completed}/${total} · ${percent}%`;
      item.tooltip = `${element.course.description}\n\nProgress: ${completed} of ${total} lessons complete (${percent}%).`;
      item.iconPath = getCourseThemeIcon(element.course);
      item.contextValue = 'course';
      return item;
    }

    const progress = this.progressStore.getLessonProgress(element.lesson.id);
    const allLessons = this.catalogProvider.getCatalog().courses.flatMap(course => course.lessons);
    const continueLesson = allLessons.find(lesson => this.progressStore.getLessonProgress(lesson.id).status !== 'completed');
    const isContinueTarget = continueLesson?.id === element.lesson.id;

    const item = new vscode.TreeItem(element.lesson.title, vscode.TreeItemCollapsibleState.None);
    item.contextValue = 'lesson';
    item.command = {
      command: 'vscodeLearn.openLesson',
      title: 'Open Lesson',
      arguments: [element.lesson.id]
    };

    if (isContinueTarget) {
      item.description = 'Continue';
      item.iconPath = new vscode.ThemeIcon('flame');
      item.tooltip = `${element.lesson.title}\n\nStatus: ${formatLessonStatus(progress.status)}\nThis is your next lesson to continue.`;
    } else {
      item.description = progress.status === 'notStarted' ? undefined : formatLessonStatus(progress.status);
      item.iconPath = new vscode.ThemeIcon(
        progress.status === 'completed'
          ? 'pass-filled'
          : progress.status === 'inProgress'
            ? 'debug-start'
            : 'circle-large-outline'
      );
      item.tooltip = `${element.lesson.title}\n\nStatus: ${formatLessonStatus(progress.status)}`;
    }

    return item;
  }

  getChildren(element?: LearnNode): LearnNode[] {
    if (!element) {
      return this.catalogProvider.getCatalog().courses.map(course => ({ kind: 'course', course }));
    }
    return element.kind === 'course' ? element.course.lessons.map(lesson => ({ kind: 'lesson', lesson })) : [];
  }
}
