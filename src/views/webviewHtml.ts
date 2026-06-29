import * as vscode from 'vscode';

export function webviewDocument(webview: vscode.Webview, title: string, body: string): string {
  const nonce = String(Date.now());
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `img-src ${webview.cspSource} https: data:`,
    `script-src 'nonce-${nonce}'`
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); line-height: 1.55; padding: 24px; max-width: 980px; margin: 0 auto; }
    a { color: var(--vscode-textLink-foreground); }
    img { max-width: 100%; border-radius: 6px; }
    .video-card { position: relative; display: block; width: 100%; max-width: 560px; margin: 16px 0; border-radius: 8px; overflow: hidden; text-decoration: none; border: 1px solid var(--vscode-panel-border); }
    .video-thumb { display: block; width: 100%; border-radius: 0; }
    .video-card .video-play { position: absolute; top: 50%; left: 50%; width: 68px; height: 48px; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.65); border-radius: 12px; transition: background 120ms ease; }
    .video-card .video-play::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-40%, -50%); border-style: solid; border-width: 11px 0 11px 19px; border-color: transparent transparent transparent #ffffff; }
    .video-card:hover .video-play { background: #ff0000; }
    .video-card .video-label { position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 10px; font-size: 0.85em; color: #ffffff; background: linear-gradient(transparent, rgba(0, 0, 0, 0.75)); }
    pre { overflow: auto; background: var(--vscode-textCodeBlock-background); padding: 12px; border-radius: 6px; }
    code { background: var(--vscode-textCodeBlock-background); padding: 0 0.2em; border-radius: 3px; }
    .cards { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .card { border: 1px solid var(--vscode-panel-border); border-radius: 8px; padding: 14px; background: var(--vscode-editor-inactiveSelectionBackground); }
    .muted { color: var(--vscode-descriptionForeground); }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
    .button { display: inline-block; border: 1px solid var(--vscode-button-border, transparent); background: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 6px 10px; border-radius: 4px; text-decoration: none; }
    .secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .lesson-complete-footer { margin: 24px 0 8px; text-align: center; }
    .complete-button { font-weight: 600; padding: 10px 14px; }
    .completion-summary { margin: 20px 0 10px; padding: 12px; border: 1px solid var(--vscode-panel-border); border-radius: 8px; background: var(--vscode-editor-inactiveSelectionBackground); }
    .completion-actions { margin: 10px 0 0; }
    .confetti-container { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 9999; }
    .confetti-piece { position: absolute; top: -12px; width: 8px; height: 14px; opacity: 0.95; animation: confetti-fall 900ms linear forwards; }
    @keyframes confetti-fall {
      from { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
      to { transform: translate3d(var(--x, 0px), 110vh, 0) rotate(540deg); opacity: 0; }
    }
    progress { width: 100%; }
  </style>
</head>
<body>${body}
  <script nonce="${nonce}">
    (() => {
      const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
      const colors = ['#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#8338ec'];
      function celebrate() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        const total = 120;
        for (let i = 0; i < total; i += 1) {
          const piece = document.createElement('span');
          piece.className = 'confetti-piece';
          piece.style.left = Math.round(Math.random() * 100) + 'vw';
          piece.style.backgroundColor = colors[i % colors.length];
          piece.style.setProperty('--x', Math.round((Math.random() - 0.5) * 360) + 'px');
          piece.style.animationDelay = Math.round(Math.random() * 200) + 'ms';
          container.appendChild(piece);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 1400);
      }

      document.querySelectorAll('button[data-complete-lesson-id]').forEach((element) => {
        element.addEventListener('click', (event) => {
          const button = event.currentTarget;
          if (!(button instanceof HTMLButtonElement)) {
            return;
          }
          const lessonId = button.dataset.completeLessonId;
          if (!lessonId || !vscodeApi || button.disabled) {
            return;
          }
          button.disabled = true;
          button.textContent = 'Completing...';
          celebrate();
          setTimeout(() => {
            vscodeApi.postMessage({ type: 'completeLesson', lessonId });
          }, 220);
        });
      });
    })();
  </script>
</body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
