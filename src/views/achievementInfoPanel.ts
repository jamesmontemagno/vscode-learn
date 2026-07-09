import * as vscode from 'vscode';
import { achievementDefinitions, findAchievementDefinition } from '../progress/achievements';
import type { ProgressStore } from '../progress/progressStore';
import { getAchievementCategory } from './courseTheme';
import { escapeHtml, webviewDocument } from './webviewHtml';

export class AchievementInfoPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly extensionUri: vscode.Uri, private readonly progressStore: ProgressStore) {}

  show(achievementId: string): void {
    const definition = findAchievementDefinition(achievementId);
    if (!definition) {
      void vscode.window.showWarningMessage(`Unknown achievement: ${achievementId}`);
      return;
    }

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel('vscodeLearn.achievementInfo', 'Achievement Info', vscode.ViewColumn.One, {
        enableCommandUris: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')]
      });
      this.panel.onDidDispose(() => { this.panel = undefined; });
    }

    const earned = this.progressStore.getState().achievements[achievementId];
    const category = getAchievementCategory(definition.category);
    const badgeUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', definition.badgeAsset)
    );

    const related = achievementDefinitions
      .filter(item => item.category === definition.category && item.id !== definition.id)
      .map(item => {
        const relatedEarned = this.progressStore.getState().achievements[item.id];
        const relatedBadge = this.panel?.webview.asWebviewUri(
          vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', item.badgeAsset)
        ).toString();
        return `<a class="vl-card vl-badge-tile${relatedEarned ? '' : ' is-locked'}" href="${achievementDetailsCommandUri(item.id)}">
  <img class="achievement-badge" src="${escapeHtml(relatedBadge ?? '')}" alt="${escapeHtml(item.title)} badge">
  <div class="vl-badge-meta">
    <strong>${escapeHtml(item.title)}</strong>
    <span class="vl-chip ${relatedEarned ? 'vl-chip-success' : 'vl-chip-muted'}">${relatedEarned ? 'Unlocked' : 'Locked'}</span>
  </div>
</a>`;
      }).join('');

    const body = `
<div class="vl-achievement-page">
<section class="vl-hero course-default">
  <div class="vl-hero-content">
    <div class="vl-kicker">${escapeHtml(category.title)}</div>
    <div class="vl-badge-glow">
      <img class="achievement-badge achievement-badge-large" src="${escapeHtml(badgeUri.toString())}" alt="${escapeHtml(definition.title)} badge" style="margin:0;${earned ? '' : 'filter:grayscale(1) brightness(0.85);opacity:0.8'}">
    </div>
    <h1>${escapeHtml(definition.title)}</h1>
    <div class="vl-row" style="justify-content:center">
      <span class="vl-chip ${earned ? 'vl-chip-success' : 'vl-chip-muted'}">${earned ? 'Unlocked' : 'Locked'}</span>
      <span class="vl-pill">${escapeHtml(category.title)}</span>
    </div>
  </div>
</section>

<section class="vl-section">
  <div class="vl-completion-sheet">
    <p><strong>What it is:</strong> ${escapeHtml(definition.description)}</p>
    <p><strong>How to earn it:</strong> ${escapeHtml(definition.howToEarn)}</p>
    <p><strong>Why it matters:</strong> ${escapeHtml(definition.whyItMatters)}</p>
    <p style="margin-bottom:0"><strong>Status:</strong> ${earned ? `Unlocked on ${escapeHtml(new Date(earned.unlockedAt).toLocaleString())}` : 'Not unlocked yet — keep learning to earn this badge.'}</p>
  </div>
</section>

${related ? `<section class="vl-section">
  <div class="vl-section-title">
    <h2>More in ${escapeHtml(category.title)}</h2>
  </div>
  <div class="vl-badge-grid">${related}</div>
</section>` : ''}

<section class="vl-section">
  <div class="actions" style="margin-top:0">
    <a class="button secondary" href="command:vscodeLearn.showDashboard">Back to dashboard</a>
    <a class="button secondary" href="command:vscodeLearn.showAchievements">Focus achievements view</a>
  </div>
</section>
</div>`;

    this.panel.title = definition.title;
    this.panel.webview.html = webviewDocument(this.panel.webview, `${definition.title} Achievement`, body);
    this.panel.reveal();
  }
}

function achievementDetailsCommandUri(achievementId: string): string {
  return `command:vscodeLearn.showAchievementInfo?${encodeURIComponent(JSON.stringify([achievementId]))}`;
}
