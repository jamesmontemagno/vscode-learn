import * as vscode from 'vscode';
import { findAchievementDefinition } from '../progress/achievements';
import type { ProgressStore } from '../progress/progressStore';
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
    const badgeUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'achievements', definition.badgeAsset)
    );
    const body = `<p class="muted">Achievement details</p>
<img class="achievement-badge achievement-badge-large" src="${escapeHtml(badgeUri.toString())}" alt="${escapeHtml(definition.title)} badge">
<h1>${escapeHtml(definition.title)}</h1>
<div class="completion-summary">
  <p><strong>What it is:</strong> ${escapeHtml(definition.description)}</p>
  <p><strong>How to earn it:</strong> ${escapeHtml(definition.howToEarn)}</p>
  <p><strong>Why it matters:</strong> ${escapeHtml(definition.whyItMatters)}</p>
  <p><strong>Status:</strong> ${earned ? `Unlocked on ${new Date(earned.unlockedAt).toLocaleString()}` : 'Not unlocked yet'}</p>
</div>
<div class="actions">
  <a class="button secondary" href="command:vscodeLearn.showDashboard">Back to dashboard</a>
  <a class="button secondary" href="command:vscodeLearn.showAchievements">Focus achievements view</a>
</div>`;

    this.panel.title = definition.title;
    this.panel.webview.html = webviewDocument(this.panel.webview, `${definition.title} Achievement`, body);
    this.panel.reveal();
  }
}
