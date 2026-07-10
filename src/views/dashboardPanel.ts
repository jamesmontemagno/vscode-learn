import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import { getAllLessons, type LearnCourse } from '../catalog/types';
import type { ProgressStore } from '../progress/progressStore';
import type { HistoryEvent } from '../progress/types';
import { achievementDetailsCommandUri } from './commandUris';
import {
  courseThemeClass,
  getCourseTheme,
  historyGroupLabel,
  progressRingSvg
} from './courseTheme';
import { escapeHtml, webviewDocument } from './webviewHtml';

export class DashboardPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly catalogProvider: CatalogProvider,
    private readonly progressStore: ProgressStore
  ) {
    catalogProvider.onDidChangeCatalog(() => this.render());
    progressStore.onDidChangeProgress(() => this.render());
  }

  show(): void {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('vscodeLearn.dashboard', 'VS Code Learn Dashboard', vscode.ViewColumn.One, {
        enableCommandUris: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
      });
      this.panel.onDidDispose(() => { this.panel = undefined; });
    }
    this.render();
    this.panel.reveal();
  }

  private render(): void {
    if (!this.panel) {
      return;
    }

    const catalog = this.catalogProvider.getCatalog();
    const allLessons = getAllLessons(catalog);
    const completed = allLessons.filter(lesson => this.progressStore.getLessonProgress(lesson.id).status === 'completed').length;
    const inProgress = allLessons.filter(lesson => this.progressStore.getLessonProgress(lesson.id).status === 'inProgress').length;
    const nextLesson = allLessons.find(lesson => this.progressStore.getLessonProgress(lesson.id).status !== 'completed');
    const nextCourse = nextLesson ? catalog.courses.find(course => course.id === nextLesson.courseId) : undefined;
    const overallPercent = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;
    const earnedEntries = this.progressStore.getEarnedAchievements();
    const earnedCount = earnedEntries.filter(entry => entry.earned).length;
    const streakDays = computeCompletionStreakDays(this.progressStore);
    const history = this.progressStore.getState().history.slice(0, 10);
    const heroThemeClass = nextCourse ? courseThemeClass(nextCourse) : 'course-default';

    const continueHref = nextLesson
      ? `command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([nextLesson.id]))}`
      : 'command:vscodeLearn.showDashboard';

    const courseCards = catalog.courses.map(course => this.renderCourseCard(course)).join('');
    const achievementTiles = earnedEntries.map(entry => {
      const badgeUri = this.panel?.webview.asWebviewUri(
        vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', entry.definition.badgeAsset)
      ).toString();
      const lockedClass = entry.earned ? '' : ' is-locked';
      return `<a class="vl-card vl-badge-tile${lockedClass}" href="${achievementDetailsCommandUri(entry.definition.id)}">
  <img class="achievement-badge" src="${escapeHtml(badgeUri ?? '')}" alt="${escapeHtml(entry.definition.title)} badge">
  <div class="vl-badge-meta">
    <strong>${escapeHtml(entry.definition.title)}</strong>
    <span class="vl-chip ${entry.earned ? 'vl-chip-success' : 'vl-chip-muted'}">${entry.earned ? 'Unlocked' : 'Locked'}</span>
  </div>
</a>`;
    }).join('');

    const body = `
<section class="vl-hero ${heroThemeClass}">
  <div class="vl-hero-content">
    <div class="vl-between">
      <div>
        <div class="vl-kicker">Your learning path</div>
        <h1>VS Code Learn</h1>
      </div>
      <div class="vl-actions" style="margin:0">
        ${nextLesson
          ? `<a class="button" href="${continueHref}">Continue learning</a>`
          : `<span class="vl-chip vl-chip-success">Catalog complete</span>`}
        <a class="button secondary" href="command:vscodeLearn.refreshCatalog">Refresh catalog</a>
      </div>
    </div>
    <div class="vl-hero-meta">
      <span><strong>${completed}</strong> / ${allLessons.length} lessons</span>
      <span><strong>${overallPercent}%</strong> complete</span>
      <span>${streakDays > 0 ? `<strong>${streakDays}-day</strong> streak` : 'Start a streak today'}</span>
      <span><strong>${earnedCount}</strong> achievements</span>
    </div>
    <div class="vl-hero-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${overallPercent}" aria-label="Overall learning progress">
      <span style="width:${overallPercent}%"></span>
    </div>
    ${nextLesson
      ? `<p class="muted" style="margin:0">Next up: <strong>${escapeHtml(nextLesson.title)}</strong>${nextCourse ? ` · ${escapeHtml(nextCourse.title)}` : ''}</p>`
      : `<p class="muted" style="margin:0">You've completed every lesson in the catalog. Replay favorites or wait for new content.</p>`}
  </div>
</section>

<section class="vl-section">
  <div class="vl-cards vl-stats">
    <div class="vl-card vl-stat">
      <div class="vl-stat-value">${completed}/${allLessons.length}</div>
      <div class="vl-stat-label">Lessons complete</div>
    </div>
    <div class="vl-card vl-stat">
      <div class="vl-stat-value">${inProgress}</div>
      <div class="vl-stat-label">In progress</div>
    </div>
    <div class="vl-card vl-stat">
      <div class="vl-stat-value">${earnedCount}</div>
      <div class="vl-stat-label">Achievements unlocked</div>
    </div>
    <div class="vl-card vl-stat">
      <div class="vl-stat-value">${streakDays || '—'}</div>
      <div class="vl-stat-label">${streakDays ? 'Day streak' : 'No streak yet'}</div>
    </div>
  </div>
</section>

<section class="vl-section">
  <div class="vl-section-title">
    <h2>Courses</h2>
    <span class="muted">${catalog.courses.length} paths</span>
  </div>
  <div class="vl-cards">${courseCards}</div>
</section>

<section class="vl-section">
  <div class="vl-section-title">
    <h2>Trophy case</h2>
    <span class="muted">${earnedCount}/${earnedEntries.length} unlocked</span>
  </div>
  <div class="vl-badge-grid">${achievementTiles}</div>
</section>

<section class="vl-section">
  <div class="vl-section-title">
    <h2>Recent activity</h2>
  </div>
  ${history.length ? renderHistoryTimeline(history) : renderEmptyState('No activity yet', 'Open a lesson to start building your learning history.', nextLesson ? continueHref : undefined, nextLesson ? 'Start first lesson' : undefined)}
</section>

<section class="vl-section">
  <div class="vl-actions">
    <a class="button secondary" href="command:vscodeLearn.resetAllData">Reset all data</a>
  </div>
</section>`;

    this.panel.webview.html = webviewDocument(this.panel.webview, 'VS Code Learn Dashboard', body, { wide: true });
  }

  private renderCourseCard(course: LearnCourse): string {
    const done = course.lessons.filter(lesson => this.progressStore.getLessonProgress(lesson.id).status === 'completed').length;
    const total = course.lessons.length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const theme = getCourseTheme(course);
    const themeClass = courseThemeClass(course);
    const continueLesson = course.lessons.find(lesson => this.progressStore.getLessonProgress(lesson.id).status !== 'completed');
    const firstLessonId = course.lessons[0]?.id;
    const href = continueLesson
      ? `command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([continueLesson.id]))}`
      : firstLessonId
        ? `command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([firstLessonId]))}`
        : 'command:vscodeLearn.showDashboard';

    const dots = course.lessons.map(lesson => {
      const status = this.progressStore.getLessonProgress(lesson.id).status;
      const className = status === 'completed' ? 'is-done' : status === 'inProgress' ? 'is-active' : '';
      return `<span class="vl-lesson-dot ${className}" title="${escapeHtml(lesson.title)}"></span>`;
    }).join('');

    return `<a class="vl-card vl-course-card ${themeClass}" href="${href}">
  <div class="vl-course-top">
    <div class="vl-ring-wrap">
      ${progressRingSvg(percent)}
      <div class="vl-ring-label">${percent}%</div>
    </div>
    <div class="vl-course-copy">
      <h3>${escapeHtml(course.title)}</h3>
      <p>${done}/${total} lessons · ${escapeHtml(theme.label)}</p>
    </div>
  </div>
  <p class="muted vl-course-description">${escapeHtml(course.description)}</p>
  <div class="vl-lesson-dots" aria-hidden="true">${dots}</div>
  <div class="vl-row vl-course-cta">
    <span class="vl-pill vl-pill-accent">${continueLesson ? 'Continue path' : 'Review course'}</span>
    ${percent === 100 ? '<span class="vl-chip vl-chip-success">Complete</span>' : ''}
  </div>
</a>`;
  }
}

function renderHistoryTimeline(history: readonly HistoryEvent[]): string {
  return `<div class="vl-card"><div class="vl-timeline">
${history.map(item => {
    const isAchievement = item.type === 'achievementUnlocked';
    return `<div class="vl-timeline-item${isAchievement ? ' is-achievement' : ''}">
  <div class="vl-timeline-dot" aria-hidden="true"></div>
  <div>
    <div>${escapeHtml(item.message)}</div>
    <div class="vl-timeline-meta">${escapeHtml(historyGroupLabel(item.at))} · ${escapeHtml(new Date(item.at).toLocaleString())}</div>
  </div>
</div>`;
  }).join('')}
</div></div>`;
}

function renderEmptyState(title: string, message: string, href?: string, cta?: string): string {
  return `<div class="vl-empty">
  <h3>${escapeHtml(title)}</h3>
  <p class="muted">${escapeHtml(message)}</p>
  ${href && cta ? `<div class="vl-actions" style="justify-content:center"><a class="button" href="${href}">${escapeHtml(cta)}</a></div>` : ''}
</div>`;
}

function computeCompletionStreakDays(progressStore: ProgressStore): number {
  const days = [...new Set(
    Object.values(progressStore.getState().lessons)
      .flatMap(progress => progress.completedAt ? [progress.completedAt.slice(0, 10)] : [])
  )].sort();

  if (days.length === 0) {
    return 0;
  }

  const dayTimes = days.map(day => Date.parse(`${day}T00:00:00.000Z`));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const last = days[days.length - 1];
  if (last !== today && last !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let index = dayTimes.length - 1; index > 0; index -= 1) {
    const diff = (dayTimes[index] - dayTimes[index - 1]) / 86_400_000;
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
