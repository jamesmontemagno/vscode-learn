import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import { findLesson, getAllLessons, type LearnLesson } from '../catalog/types';
import { LessonContentService } from '../content/lessonContentService';
import { renderLessonMarkdown } from '../content/markdownRenderer';
import type { ProgressStore } from '../progress/progressStore';
import { escapeHtml, webviewDocument } from './webviewHtml';

export class LessonReaderPanel {
  private panel: vscode.WebviewPanel | undefined;
  private currentLessonId: string | undefined;

  constructor(
    private readonly catalogProvider: CatalogProvider,
    private readonly contentService: LessonContentService,
    private readonly progressStore: ProgressStore
  ) {}

  async open(lessonId: string, forceRefresh = false): Promise<void> {
    const catalog = this.catalogProvider.getCatalog();
    const lesson = findLesson(catalog, lessonId);
    if (!lesson) {
      throw new Error(`Unknown lesson: ${lessonId}`);
    }

    this.currentLessonId = lessonId;
    await this.progressStore.markLessonStarted(lesson);
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('vscodeLearn.lessonReader', 'VS Code Learn Lesson', vscode.ViewColumn.One, {
        enableCommandUris: true,
        enableScripts: true
      });
      this.panel.webview.onDidReceiveMessage((message: unknown) => {
        void this.handleWebviewMessage(message);
      });
      this.panel.onDidDispose(() => { this.panel = undefined; });
    }
    this.panel.title = lesson.title;
    this.panel.webview.html = webviewDocument(this.panel.webview, lesson.title, `<p>Loading ${escapeHtml(lesson.title)}...</p>`);
    this.panel.reveal();

    const content = await this.contentService.getLessonContent(lesson, forceRefresh);
    const rendered = renderLessonMarkdown(catalog, lesson, content.markdown);
    this.panel.webview.html = webviewDocument(this.panel.webview, lesson.title, this.readerBody(lesson, rendered, content.fromCache));
  }

  async refreshCurrent(): Promise<void> {
    if (this.currentLessonId) {
      await this.open(this.currentLessonId, true);
    }
  }

  private readerBody(lesson: LearnLesson, renderedMarkdown: string, fromCache: boolean): string {
    const catalog = this.catalogProvider.getCatalog();
    const lessons = getAllLessons(catalog);
    const index = lessons.findIndex(item => item.id === lesson.id);
    const previous = index > 0 ? lessons[index - 1] : undefined;
    const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined;
    const progress = this.progressStore.getLessonProgress(lesson.id);
    const course = catalog.courses.find(item => item.id === lesson.courseId);
    const courseLessons = course?.lessons ?? [];
    const courseLessonIndex = courseLessons.findIndex(item => item.id === lesson.id);
    const nextLessonInCourse = courseLessonIndex >= 0 && courseLessonIndex < courseLessons.length - 1 ? courseLessons[courseLessonIndex + 1] : undefined;
    const isCourseComplete = courseLessons.length > 0 && courseLessons.every(item => this.progressStore.getLessonProgress(item.id).status === 'completed');
    const completionSection = progress.status === 'completed'
      ? `<div class="completion-summary">
  <p><strong>Lesson complete.</strong> ${nextLessonInCourse ? 'Ready for the next lesson?' : isCourseComplete ? 'You finished this course.' : 'Great work.'}</p>
  <div class="actions completion-actions">
    ${nextLessonInCourse ? `<a class="button" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([nextLessonInCourse.id]))}">Start next lesson</a>` : ''}
    ${isCourseComplete ? '<a class="button secondary" href="command:vscodeLearn.showDashboard">Course finished — view dashboard</a>' : ''}
  </div>
</div>`
      : `<div class="lesson-complete-footer">
  <button class="button complete-button" type="button" data-complete-lesson-id="${escapeHtml(lesson.id)}">Mark lesson complete</button>
</div>`;

    return `<p class="muted">${escapeHtml(lesson.courseId)} · ${progress.status}${fromCache ? ' · cached content' : ''}</p>
<h1>${escapeHtml(lesson.title)}</h1>
<div class="actions">
  <a class="button secondary" href="command:vscodeLearn.refreshCatalog">Refresh catalog</a>
  <a class="button secondary" href="command:vscodeLearn.openOfficialPage?${encodeURIComponent(JSON.stringify([lesson.id]))}">Open official page</a>
  ${previous ? `<a class="button secondary" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([previous.id]))}">Previous</a>` : ''}
  ${next ? `<a class="button secondary" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([next.id]))}">Next</a>` : ''}
</div>
${fromCache ? '<p class="muted">Showing cached Markdown because fresh content was not needed or unavailable.</p>' : ''}
<article>${renderedMarkdown}</article>
${completionSection}`;
  }

  private async handleWebviewMessage(message: unknown): Promise<void> {
    if (!message || typeof message !== 'object') {
      return;
    }

    const command = (message as { type?: string }).type;
    if (command !== 'completeLesson') {
      return;
    }

    const lessonId = (message as { lessonId?: string }).lessonId;
    if (!lessonId) {
      return;
    }

    const lesson = findLesson(this.catalogProvider.getCatalog(), lessonId);
    if (!lesson) {
      return;
    }

    await this.progressStore.markLessonComplete(lesson);
    await this.open(lesson.id);
  }
}
