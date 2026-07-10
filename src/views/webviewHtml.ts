import * as vscode from 'vscode';

export function webviewDocument(webview: vscode.Webview, title: string, body: string, options?: { wide?: boolean }): string {
  const nonce = String(Date.now());
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `img-src ${webview.cspSource} https: data:`,
    `script-src 'nonce-${nonce}'`
  ].join('; ');
  const shellClass = options?.wide ? 'vl-shell vl-shell-wide' : 'vl-shell';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --vl-radius-sm: 6px;
      --vl-radius-md: 10px;
      --vl-radius-lg: 16px;
      --vl-space-1: 4px;
      --vl-space-2: 8px;
      --vl-space-3: 12px;
      --vl-space-4: 16px;
      --vl-space-5: 24px;
      --vl-space-6: 32px;
      --vl-border: var(--vscode-panel-border, color-mix(in srgb, var(--vscode-foreground) 18%, transparent));
      --vl-surface-1: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-foreground) 8%);
      --vl-surface-2: var(--vscode-editor-inactiveSelectionBackground, color-mix(in srgb, var(--vscode-foreground) 6%, transparent));
      --vl-muted: var(--vscode-descriptionForeground);
      --vl-focus: var(--vscode-focusBorder);
      --vl-success: var(--vscode-testing-iconPassed, var(--vscode-charts-green));
      --course-accent: var(--vscode-charts-blue);
      --course-soft: color-mix(in srgb, var(--course-accent) 16%, transparent);
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.55;
    }

    .vl-shell { max-width: 980px; margin: 0 auto; padding: var(--vl-space-5); }
    .vl-shell-wide { max-width: 1100px; }

    a { color: var(--vscode-textLink-foreground); }
    a:hover { color: var(--vscode-textLink-activeForeground); }
    img { max-width: 100%; border-radius: var(--vl-radius-sm); }
    h1, h2, h3, h4 { line-height: 1.25; margin: 0 0 var(--vl-space-3); }
    h1 { font-size: 1.75rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.2rem; margin-top: var(--vl-space-6); }
    p { margin: 0 0 var(--vl-space-3); }
    ul { margin: 0; padding-left: 1.2rem; }
    li + li { margin-top: 6px; }

    pre {
      overflow: auto;
      background: var(--vscode-textCodeBlock-background);
      padding: var(--vl-space-3);
      border-radius: var(--vl-radius-sm);
      border: 1px solid var(--vl-border);
    }
    code {
      background: var(--vscode-textCodeBlock-background);
      padding: 0 0.25em;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, ui-monospace, monospace);
    }
    pre code { background: transparent; padding: 0; }

    .muted, .vl-muted { color: var(--vl-muted); }
    .vl-row { display: flex; gap: var(--vl-space-3); flex-wrap: wrap; align-items: center; }
    .vl-between { display: flex; gap: var(--vl-space-3); flex-wrap: wrap; align-items: center; justify-content: space-between; }
    .vl-section { margin-top: var(--vl-space-6); }
    .vl-section-title {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--vl-space-3);
      margin-bottom: var(--vl-space-3);
    }
    .vl-section-title h2 { margin: 0; }

    .vl-hero {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--vl-border);
      border-radius: var(--vl-radius-lg);
      padding: var(--vl-space-5);
      background:
        radial-gradient(1200px 240px at 0% 0%, color-mix(in srgb, var(--course-accent) 22%, transparent), transparent 60%),
        linear-gradient(160deg, var(--vl-surface-1), var(--vscode-editor-background));
    }
    .vl-hero::after {
      content: '';
      position: absolute;
      inset: auto -20% -40% auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--course-accent) 14%, transparent);
      pointer-events: none;
    }
    .vl-hero-content { position: relative; z-index: 1; display: grid; gap: var(--vl-space-3); }
    .vl-kicker {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--vl-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .vl-hero h1 { margin-bottom: 0; }
    .vl-hero-meta { display: flex; flex-wrap: wrap; gap: var(--vl-space-2) var(--vl-space-4); color: var(--vl-muted); font-size: 0.95rem; }
    .vl-hero-progress {
      height: 8px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--vscode-foreground) 10%, transparent);
      overflow: hidden;
      border: 1px solid var(--vl-border);
    }
    .vl-hero-progress > span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--course-accent), color-mix(in srgb, var(--course-accent) 55%, var(--vscode-button-background)));
      transition: width 240ms ease;
    }

    .cards, .vl-cards {
      display: grid;
      gap: var(--vl-space-3);
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .vl-stats { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }

    .card, .vl-card {
      border: 1px solid var(--vl-border);
      border-radius: var(--vl-radius-md);
      padding: var(--vl-space-4);
      background: var(--vl-surface-2);
      transition: border-color 140ms ease, transform 140ms ease, background 140ms ease;
    }
    a.vl-card { text-decoration: none; color: inherit; display: block; }
    a.vl-card:hover {
      border-color: color-mix(in srgb, var(--course-accent) 55%, var(--vl-border));
      background: color-mix(in srgb, var(--course-accent) 8%, var(--vl-surface-2));
      transform: translateY(-1px);
    }
    a.vl-card:focus-visible, .button:focus-visible, button:focus-visible, .vl-btn:focus-visible {
      outline: 1px solid var(--vl-focus);
      outline-offset: 2px;
    }

    .vl-stat { display: grid; gap: 6px; align-content: start; }
    .vl-stat-value { font-size: 1.8rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
    .vl-stat-label { color: var(--vl-muted); font-size: 0.92rem; }

    .vl-course-card {
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-rows: auto auto auto auto;
      gap: 0;
      border-left: 3px solid var(--course-accent);
      background: linear-gradient(135deg, var(--course-soft), transparent 48%), var(--vl-surface-2);
    }
    .vl-course-top { display: flex; gap: var(--vl-space-3); align-items: center; margin-bottom: 16px; }
    .vl-course-copy { min-width: 0; flex: 1; }
    .vl-course-copy h3 { margin: 0 0 4px; font-size: 1.05rem; }
    .vl-course-copy p { margin: 0; color: var(--vl-muted); font-size: 0.9rem; }
    .vl-course-description {
      margin: 0 0 16px;
      line-height: 1.5;
    }
    .vl-lesson-dots {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      padding: 0;
      margin: 0 0 16px;
    }
    .vl-lesson-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--course-accent) 55%, var(--vl-border));
      background: transparent;
    }
    .vl-lesson-dot.is-done { background: var(--course-accent); border-color: var(--course-accent); }
    .vl-lesson-dot.is-active {
      box-shadow: 0 0 0 3px var(--course-soft);
      background: color-mix(in srgb, var(--course-accent) 45%, transparent);
    }
    .vl-course-cta {
      margin: 0;
      gap: var(--vl-space-2);
    }
    .vl-course-card > .vl-row {
      margin-top: 2px;
      gap: var(--vl-space-2);
    }

    .course-foundations { --course-accent: var(--vscode-charts-blue); --course-soft: color-mix(in srgb, var(--vscode-charts-blue) 16%, transparent); }
    .course-customizations { --course-accent: var(--vscode-charts-purple); --course-soft: color-mix(in srgb, var(--vscode-charts-purple) 16%, transparent); }
    .course-agents { --course-accent: var(--vscode-charts-green); --course-soft: color-mix(in srgb, var(--vscode-charts-green) 16%, transparent); }
    .course-default { --course-accent: var(--vscode-charts-orange); --course-soft: color-mix(in srgb, var(--vscode-charts-orange) 16%, transparent); }

    .vl-ring-wrap {
      position: relative;
      display: grid;
      place-items: center;
      width: fit-content;
      height: fit-content;
      flex: 0 0 auto;
      line-height: 0;
    }
    .vl-ring {
      grid-area: 1 / 1;
      display: block;
      transform: rotate(-90deg);
    }
    .vl-ring-track { fill: none; stroke: color-mix(in srgb, var(--vscode-foreground) 12%, transparent); }
    .vl-ring-value { fill: none; stroke: var(--course-accent); stroke-linecap: round; transition: stroke-dashoffset 240ms ease; }
    .vl-ring-label {
      grid-area: 1 / 1;
      position: relative;
      z-index: 1;
      display: block;
      margin: 0;
      padding: 0;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      text-align: center;
      transform: translateY(0.5px);
      pointer-events: none;
    }
    .vl-ring-wrap.is-sm .vl-ring-label { font-size: 0.64rem; }

    .actions, .vl-actions { display: flex; gap: var(--vl-space-2); flex-wrap: wrap; margin: var(--vl-space-4) 0; }
    .button, .vl-btn, button.button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 1px solid var(--vscode-button-border, transparent);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      padding: 8px 12px;
      border-radius: var(--vl-radius-sm);
      text-decoration: none;
      cursor: pointer;
      font: inherit;
      line-height: 1.2;
      transition: filter 120ms ease, background 120ms ease;
    }
    .button:hover, .vl-btn:hover, button.button:hover { filter: brightness(1.08); }
    .button:disabled, button.button:disabled { opacity: 0.65; cursor: default; filter: none; }
    .secondary, .vl-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border-color: var(--vscode-button-border, transparent);
    }
    .complete-button { font-weight: 600; padding: 10px 16px; min-width: 180px; }

    .vl-pill, .vl-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--vl-border);
      background: var(--vl-surface-2);
      color: var(--vscode-foreground);
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .vl-pill-accent {
      background: var(--course-soft);
      border-color: color-mix(in srgb, var(--course-accent) 40%, var(--vl-border));
    }
    .vl-chip-success {
      background: color-mix(in srgb, var(--vl-success) 16%, transparent);
      border-color: color-mix(in srgb, var(--vl-success) 40%, var(--vl-border));
    }
    .vl-chip-progress {
      background: color-mix(in srgb, var(--vscode-charts-blue) 16%, transparent);
      border-color: color-mix(in srgb, var(--vscode-charts-blue) 40%, var(--vl-border));
    }
    .vl-chip-muted { color: var(--vl-muted); }

    .vl-banner {
      display: flex;
      gap: var(--vl-space-3);
      align-items: flex-start;
      padding: var(--vl-space-3) var(--vl-space-4);
      border-radius: var(--vl-radius-md);
      border: 1px solid var(--vl-border);
      background: var(--vl-surface-2);
      margin: var(--vl-space-3) 0;
    }
    .vl-banner-info {
      border-color: color-mix(in srgb, var(--vscode-charts-blue) 35%, var(--vl-border));
      background: color-mix(in srgb, var(--vscode-charts-blue) 10%, var(--vl-surface-2));
    }

    .vl-reader-chrome {
      position: sticky;
      top: 0;
      z-index: 5;
      margin: calc(var(--vl-space-5) * -1) calc(var(--vl-space-5) * -1) var(--vl-space-3);
      padding: 10px var(--vl-space-5) 12px;
      border-bottom: 1px solid var(--vl-border);
      background: color-mix(in srgb, var(--vscode-editor-background) 94%, transparent);
      backdrop-filter: blur(8px);
    }
    .vl-reader-chrome .vl-between { gap: var(--vl-space-2); align-items: center; }
    .vl-reader-chrome .vl-row { gap: 8px; }
    .vl-reader-title {
      margin: 6px 0 8px;
      font-size: 1.28rem;
      letter-spacing: -0.02em;
    }
    .vl-reader-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 12px;
      margin-top: 2px;
    }
    .vl-reader-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      margin: 0;
    }
    .vl-path-steps {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
      margin: 0;
      min-height: 18px;
    }
    .vl-path-step {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--course-accent) 50%, var(--vl-border));
      background: transparent;
    }
    .vl-path-step.is-done { background: var(--course-accent); border-color: var(--course-accent); }
    .vl-path-step.is-current {
      background: color-mix(in srgb, var(--course-accent) 45%, transparent);
      box-shadow: 0 0 0 2px var(--course-soft);
    }
    .vl-reader-chrome .button {
      padding: 5px 10px;
      font-size: 0.9rem;
    }
    .vl-reader-chrome .vl-pill,
    .vl-reader-chrome .vl-chip {
      padding: 2px 8px;
      font-size: 0.78rem;
    }
    .vl-icon {
      display: inline-block;
      width: 0.95em;
      height: 0.95em;
      margin-right: 0.35em;
      vertical-align: -0.1em;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .vl-icon-only {
      margin-right: 0;
      width: 1em;
      height: 1em;
    }

    article {
      border: 1px solid var(--vl-border);
      border-radius: var(--vl-radius-lg);
      padding: var(--vl-space-5);
      background: color-mix(in srgb, var(--vscode-editor-background) 96%, var(--vscode-foreground) 4%);
    }
    article > :first-child { margin-top: 0; }
    article h2 {
      margin-top: var(--vl-space-5);
      padding-top: var(--vl-space-3);
      border-top: 1px solid color-mix(in srgb, var(--vl-border) 80%, transparent);
    }
    article h2:first-child { border-top: 0; padding-top: 0; }
    article img { border: 1px solid var(--vl-border); }

    .lesson-complete-footer, .vl-complete-footer {
      margin: var(--vl-space-5) 0 var(--vl-space-2);
      text-align: center;
    }
    .completion-summary, .vl-completion-sheet {
      margin: var(--vl-space-5) 0 var(--vl-space-3);
      padding: var(--vl-space-4);
      border: 1px solid color-mix(in srgb, var(--vl-success) 35%, var(--vl-border));
      border-radius: var(--vl-radius-lg);
      background:
        radial-gradient(600px 160px at 0% 0%, color-mix(in srgb, var(--vl-success) 14%, transparent), transparent 60%),
        var(--vl-surface-2);
    }
    .completion-actions { margin: var(--vl-space-3) 0 0; }

    .vl-timeline { display: grid; gap: 0; }
    .vl-timeline-item {
      display: grid;
      grid-template-columns: 16px 1fr;
      gap: var(--vl-space-3);
      padding: var(--vl-space-3) 0;
      border-bottom: 1px solid color-mix(in srgb, var(--vl-border) 80%, transparent);
    }
    .vl-timeline-item:last-child { border-bottom: 0; }
    .vl-timeline-dot {
      width: 10px;
      height: 10px;
      margin-top: 6px;
      border-radius: 50%;
      background: var(--course-accent, var(--vscode-charts-blue));
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--course-accent, var(--vscode-charts-blue)) 18%, transparent);
    }
    .vl-timeline-item.is-achievement .vl-timeline-dot { background: var(--vscode-charts-yellow, var(--vscode-charts-orange)); }
    .vl-timeline-meta { color: var(--vl-muted); font-size: 0.85rem; }

    .achievement-badge { width: 56px; height: 56px; object-fit: contain; display: block; margin-bottom: 8px; }
    .achievement-badge-large {
      width: 280px;
      height: 280px;
      max-width: min(280px, 78vw);
      max-height: min(280px, 78vw);
      margin: 0 auto 12px;
      object-fit: contain;
    }
    .vl-badge-tile {
      text-align: center;
      display: grid;
      gap: var(--vl-space-2);
      justify-items: center;
      align-content: start;
    }
    .vl-badge-tile .vl-badge-meta {
      display: grid;
      gap: 6px;
      justify-items: center;
    }
    .vl-badge-tile .vl-badge-meta strong {
      display: block;
      line-height: 1.25;
    }
    .vl-badge-tile .vl-chip {
      margin-top: 0;
    }
    .vl-badge-tile.is-locked .achievement-badge,
    .vl-badge-tile.is-locked .achievement-badge-large {
      filter: grayscale(1) brightness(0.85);
      opacity: 0.72;
    }
    .vl-badge-glow {
      width: min(320px, 86vw);
      height: min(320px, 86vw);
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: radial-gradient(circle, color-mix(in srgb, var(--course-accent) 28%, transparent), transparent 68%);
      margin: 0 auto var(--vl-space-3);
    }
    .vl-badge-grid {
      display: grid;
      gap: var(--vl-space-3);
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    .vl-achievement-page .vl-hero {
      padding: var(--vl-space-5) var(--vl-space-4) var(--vl-space-4);
      text-align: center;
    }
    .vl-achievement-page .vl-hero-content { gap: var(--vl-space-3); }
    .vl-achievement-page h1 {
      font-size: 1.55rem;
      margin: 0;
    }
    .vl-achievement-page .vl-badge-glow {
      width: min(340px, 88vw);
      height: min(340px, 88vw);
      margin: 4px auto var(--vl-space-3);
    }
    .vl-achievement-page .achievement-badge-large,
    .vl-achievement-page .vl-badge-glow > img.achievement-badge-large {
      width: min(300px, 80vw) !important;
      height: min(300px, 80vw) !important;
      max-width: min(300px, 80vw) !important;
      max-height: min(300px, 80vw) !important;
      margin: 0 !important;
      object-fit: contain;
    }
    .vl-achievement-page .vl-section { margin-top: var(--vl-space-4); }
    .vl-achievement-page .vl-completion-sheet {
      margin-top: 0;
      padding: var(--vl-space-3) var(--vl-space-4);
    }
    .vl-achievement-page .vl-completion-sheet p { margin-bottom: 8px; }
    .vl-achievement-page .vl-completion-sheet p:last-child { margin-bottom: 0; }
    .vl-achievement-page .achievement-badge { width: 56px; height: 56px; margin: 0 0 2px; }
    .vl-achievement-page .vl-badge-tile {
      padding: var(--vl-space-3);
      gap: 8px;
    }
    .vl-achievement-page .vl-badge-tile strong {
      font-size: 0.95rem;
    }
    .vl-achievement-page .vl-badge-tile .vl-chip {
      font-size: 0.75rem;
      padding: 2px 8px;
    }

    .video-card {
      position: relative;
      display: block;
      width: 100%;
      max-width: 560px;
      margin: 16px 0;
      border-radius: var(--vl-radius-md);
      overflow: hidden;
      text-decoration: none;
      border: 1px solid var(--vl-border);
    }
    .video-thumb { display: block; width: 100%; border-radius: 0; }
    .video-card .video-play {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 68px;
      height: 48px;
      transform: translate(-50%, -50%);
      background: color-mix(in srgb, #000 65%, transparent);
      border-radius: 12px;
      transition: background 120ms ease;
    }
    .video-card .video-play::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-40%, -50%);
      border-style: solid;
      border-width: 11px 0 11px 19px;
      border-color: transparent transparent transparent #ffffff;
    }
    .video-card:hover .video-play { background: #ff0000; }
    .video-card .video-label {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 8px 10px;
      font-size: 0.85em;
      color: #ffffff;
      background: linear-gradient(transparent, color-mix(in srgb, #000 75%, transparent));
    }

    .vl-empty {
      text-align: center;
      padding: var(--vl-space-6) var(--vl-space-4);
      border: 1px dashed var(--vl-border);
      border-radius: var(--vl-radius-lg);
      background: var(--vl-surface-2);
    }
    .vl-empty h3 { margin-bottom: var(--vl-space-2); }

    progress {
      width: 100%;
      height: 8px;
      border: 0;
      border-radius: 999px;
      overflow: hidden;
      background: color-mix(in srgb, var(--vscode-foreground) 10%, transparent);
    }
    progress::-webkit-progress-bar {
      background: color-mix(in srgb, var(--vscode-foreground) 10%, transparent);
      border-radius: 999px;
    }
    progress::-webkit-progress-value {
      background: var(--course-accent, var(--vscode-button-background));
      border-radius: 999px;
    }
    progress::-moz-progress-bar {
      background: var(--course-accent, var(--vscode-button-background));
      border-radius: 999px;
    }

    .confetti-container { position: fixed; inset: 0; pointer-events: none; overflow: hidden; z-index: 9999; }
    .confetti-piece {
      position: absolute;
      top: -12px;
      width: 8px;
      height: 14px;
      opacity: 0.95;
      animation: confetti-fall 1800ms linear forwards;
    }
    @keyframes confetti-fall {
      from { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
      to { transform: translate3d(var(--x, 0px), 110vh, 0) rotate(540deg); opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    @media (max-width: 640px) {
      .vl-shell { padding: var(--vl-space-4); }
      .vl-reader-chrome {
        margin: calc(var(--vl-space-4) * -1) calc(var(--vl-space-4) * -1) var(--vl-space-3);
        padding: 8px var(--vl-space-4) 10px;
      }
      .vl-reader-title { font-size: 1.12rem; }
      .vl-reader-toolbar { flex-direction: column; align-items: stretch; }
      .vl-path-steps { justify-content: flex-start; }
      article { padding: var(--vl-space-4); }
      .vl-stat-value { font-size: 1.45rem; }
      .vl-achievement-page h1 { font-size: 1.2rem; }
    }
  </style>
</head>
<body>
  <div class="${shellClass}">
    ${body}
  </div>
  <script nonce="${nonce}">
    (() => {
      const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
      const fallbackColors = ['#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#8338ec'];
      function celebrate() {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          return;
        }
        const container = document.createElement('div');
        container.className = 'confetti-container';
        const total = 120;
        for (let i = 0; i < total; i += 1) {
          const piece = document.createElement('span');
          piece.className = 'confetti-piece';
          piece.style.left = Math.round(Math.random() * 100) + 'vw';
          piece.style.backgroundColor = fallbackColors[i % fallbackColors.length];
          piece.style.setProperty('--x', Math.round((Math.random() - 0.5) * 360) + 'px');
          piece.style.animationDelay = Math.round(Math.random() * 600) + 'ms';
          container.appendChild(piece);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 3200);
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
          button.textContent = 'Celebrating...';
          celebrate();
          setTimeout(() => {
            vscodeApi.postMessage({ type: 'completeLesson', lessonId });
          }, 2600);
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
