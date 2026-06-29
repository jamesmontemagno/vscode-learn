import * as vscode from 'vscode';
import type { LearnLesson } from '../catalog/types';
import { ContentCache, type CachedLessonContent } from './contentCache';

export interface LessonContentResult extends CachedLessonContent {
  readonly fromCache: boolean;
}

export class LessonContentService {
  private readonly cache: ContentCache;

  constructor(context: vscode.ExtensionContext) {
    this.cache = new ContentCache(context);
  }

  async getLessonContent(lesson: LearnLesson, forceRefresh = false): Promise<LessonContentResult> {
    const cached = await this.cache.read(lesson.id);
    const intervalHours = vscode.workspace.getConfiguration('vscodeLearn').get<number>('sync.intervalHours', 24);
    const isFresh = cached ? Date.now() - cached.fetchedAt < intervalHours * 60 * 60 * 1000 : false;

    if (cached && isFresh && !forceRefresh) {
      return { ...cached, fromCache: true };
    }

    try {
      const response = await fetch(lesson.rawMarkdownUrl);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const markdown = await response.text();
      const stored = await this.cache.write(lesson.id, markdown, response.headers.get('etag') ?? undefined);
      return { ...stored, fromCache: false };
    } catch (error) {
      if (cached) {
        vscode.window.showWarningMessage(`Unable to refresh "${lesson.title}". Showing cached content. ${messageFromError(error)}`);
        return { ...cached, fromCache: true };
      }
      throw new Error(`Unable to load "${lesson.title}" and no cached content is available: ${messageFromError(error)}`);
    }
  }
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
