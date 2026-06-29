import * as vscode from 'vscode';
import type { CatalogProvider } from '../catalog/catalogProvider';
import { getAllLessons } from '../catalog/types';
import type { ProgressStore } from '../progress/progressStore';
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
    const earned = this.progressStore.getEarnedAchievements().filter(entry => entry.earned);
    const history = this.progressStore.getState().history.slice(0, 8);

    const courseCards = catalog.courses.map(course => {
      const done = course.lessons.filter(lesson => this.progressStore.getLessonProgress(lesson.id).status === 'completed').length;
      return `<section class="card"><h3>${escapeHtml(course.title)}</h3><progress max="${course.lessons.length}" value="${done}"></progress><p class="muted">${done}/${course.lessons.length} lessons complete</p><p>${escapeHtml(course.description)}</p></section>`;
    }).join('');

    const body = `<h1>VS Code Learn Dashboard</h1>
<div class="actions">
  ${nextLesson ? `<a class="button" href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([nextLesson.id]))}">Continue: ${escapeHtml(nextLesson.title)}</a>` : ''}
  <a class="button secondary" href="command:vscodeLearn.refreshCatalog">Refresh catalog</a>
  <a class="button secondary" href="command:vscodeLearn.resetAllProgress">Reset all progress</a>
</div>
<div class="cards">
  <section class="card"><h2>${completed}/${allLessons.length}</h2><p>Lessons complete</p></section>
  <section class="card"><h2>${inProgress}</h2><p>Lessons in progress</p></section>
  <section class="card"><h2>${earned.length}</h2><p>Achievements earned</p></section>
</div>
<h2>Courses</h2><div class="cards">${courseCards}</div>
<h2>Recent activity</h2>${history.length ? `<ul>${history.map(item => `<li>${escapeHtml(item.message)} <span class="muted">${new Date(item.at).toLocaleString()}</span></li>`).join('')}</ul>` : '<p class="muted">No activity yet.</p>'}
<h2>Achievements</h2><div class="cards">${this.progressStore.getEarnedAchievements().map(entry => {
      const badgeUri = this.panel?.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', entry.definition.badgeAsset)).toString();
      return `<section class="card">
  <img class="achievement-badge" src="${escapeHtml(badgeUri ?? '')}" alt="${escapeHtml(entry.definition.title)} badge">
  <h3>${entry.earned ? '' : '🔒 '}${escapeHtml(entry.definition.title)}</h3>
  <p>${escapeHtml(entry.definition.description)}</p>
  <p class="muted">${escapeHtml(entry.definition.howToEarn)}</p>
  <div class="actions"><a class="button secondary" href="${achievementDetailsCommandUri(entry.definition.id)}">View badge info</a></div>
</section>`;
    }).join('')}</div>`;

    this.panel.webview.html = webviewDocument(this.panel.webview, 'VS Code Learn Dashboard', body);
  }
}

function achievementDetailsCommandUri(achievementId: string): string {
  return `command:vscodeLearn.showAchievementInfo?${encodeURIComponent(JSON.stringify([achievementId]))}`;
}
