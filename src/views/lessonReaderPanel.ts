import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import { findLesson, getAllLessons, type LearnLesson } from '../catalog/types';
import { LessonContentService } from '../content/lessonContentService';
import { renderLessonMarkdown } from '../content/markdownRenderer';
import type { ProgressStore } from '../progress/progressStore';
import { courseThemeClass, formatLessonStatus, getCourseTheme, progressRingSvg } from './courseTheme';
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
    this.panel.webview.html = webviewDocument(this.panel.webview, lesson.title, `<p class="muted">Loading ${escapeHtml(lesson.title)}...</p>`);
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
    const completedInCourse = courseLessons.filter(item => this.progressStore.getLessonProgress(item.id).status === 'completed').length;
    const coursePercent = courseLessons.length ? Math.round((completedInCourse / courseLessons.length) * 100) : 0;
    const isCourseComplete = courseLessons.length > 0 && completedInCourse === courseLessons.length;
    const theme = course ? getCourseTheme(course) : getCourseTheme(lesson.courseId);
    const themeClass = course ? courseThemeClass(course) : courseThemeClass(lesson.courseId);
    const statusLabel = formatLessonStatus(progress.status);
    const statusChipClass = progress.status === 'completed'
      ? 'vl-chip-success'
      : progress.status === 'inProgress'
        ? 'vl-chip-progress'
        : 'vl-chip-muted';

    const pathSteps = courseLessons.map((item, stepIndex) => {
      const status = this.progressStore.getLessonProgress(item.id).status;
      const className = item.id === lesson.id
        ? 'is-current'
        : status === 'completed'
          ? 'is-done'
          : '';
      return `<span class="vl-path-step ${className}" title="${escapeHtml(item.title)} · Lesson ${stepIndex + 1}"></span>`;
    }).join('');

    const iconChevronLeft = `<svg class="vl-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8 10 12.5"/></svg>`;
    const iconChevronRight = `<svg class="vl-icon" viewBox="0 0 16 16" aria-hidden="true" style="margin-left:0.35em;margin-right:0"><path d="M6 3.5 10.5 8 6 12.5"/></svg>`;
    const iconLink = `<svg class="vl-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 9.5 9.5 6.5"/><path d="M7.2 4.3 8.5 3a3 3 0 0 1 4.2 4.2l-1.3 1.3"/><path d="M8.8 11.7 7.5 13A3 3 0 0 1 3.3 8.8l1.3-1.3"/></svg>`;
    const iconDashboard = `<svg class="vl-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/></svg>`;

    const completionSection = progress.status === 'completed'
      ? `<div class="vl-completion-sheet ${themeClass}">
  <div class="vl-between">
    <div>
      <div class="vl-kicker">Lesson complete</div>
      <h2 style="margin:6px 0 8px">Nice work</h2>
      <p class="muted" style="margin:0">${nextLessonInCourse
        ? 'Ready for the next lesson in this course?'
        : isCourseComplete
          ? 'You finished this course. Celebrate and check the dashboard.'
          : 'Great progress — keep the momentum going.'}</p>
    </div>
    <div class="vl-ring-wrap">
      ${progressRingSvg(coursePercent)}
      <div class="vl-ring-label">${coursePercent}%</div>
    </div>
  </div>
  <div class="actions completion-actions">
    ${nextLessonInCourse ? `<a class="button" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([nextLessonInCourse.id]))}">Start next lesson</a>` : ''}
    ${isCourseComplete ? '<a class="button secondary" href="command:vscodeLearn.showDashboard">Course finished — view dashboard</a>' : ''}
    ${!nextLessonInCourse && !isCourseComplete && next ? `<a class="button secondary" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([next.id]))}">Browse next lesson</a>` : ''}
  </div>
</div>`
      : `<div class="lesson-complete-footer vl-complete-footer">
  <button class="button complete-button" type="button" data-complete-lesson-id="${escapeHtml(lesson.id)}">Mark lesson complete</button>
</div>`;

    return `
<header class="vl-reader-chrome ${themeClass}">
  <div class="vl-between">
    <div class="vl-row">
      <span class="vl-pill vl-pill-accent">${escapeHtml(course?.title ?? theme.label)}</span>
      <span class="muted">Lesson ${courseLessonIndex >= 0 ? courseLessonIndex + 1 : '?'} of ${courseLessons.length || '?'}</span>
      <span class="vl-chip ${statusChipClass}">${escapeHtml(statusLabel)}</span>
      ${fromCache ? '<span class="vl-chip vl-chip-muted">Cached</span>' : ''}
    </div>
    <div class="vl-ring-wrap is-sm" title="Course progress">
      ${progressRingSvg(coursePercent, 44, 4)}
      <div class="vl-ring-label">${coursePercent}%</div>
    </div>
  </div>
  <h1 class="vl-reader-title">${escapeHtml(lesson.title)}</h1>
  <div class="vl-reader-toolbar">
    <div class="actions vl-reader-nav">
      ${previous ? `<a class="button secondary" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([previous.id]))}" title="Previous lesson">${iconChevronLeft}Prev</a>` : ''}
      ${next ? `<a class="button secondary" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([next.id]))}" title="Next lesson">Next${iconChevronRight}</a>` : ''}
      <a class="button secondary" href="command:vscodeLearn.openOfficialPage?${encodeURIComponent(JSON.stringify([lesson.id]))}" title="Open official page">${iconLink}Official</a>
      <a class="button secondary" href="command:vscodeLearn.showDashboard" title="Open dashboard">${iconDashboard}Dashboard</a>
    </div>
    <div class="vl-path-steps" aria-label="Course lesson path">${pathSteps}</div>
  </div>
</header>

${fromCache ? `<div class="vl-banner vl-banner-info"><div><strong>Showing cached content</strong><div class="muted">Fresh content was not needed or unavailable. You can still learn offline.</div></div></div>` : ''}

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
