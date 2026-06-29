import type { LearnCatalog, LearnLesson } from './types';
import { findLesson } from './types';

const docsMediaRoot = 'https://github.com/microsoft/vscode-docs/raw/refs/heads/main';
const docsWebRoot = 'https://code.visualstudio.com';

export function lessonIdFromLearnPath(path: string): string | undefined {
  const match = /^\/learn\/([^/]+)\/([^#?]+)/.exec(path);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

export function resolveLearnLink(catalog: LearnCatalog, href: string): LearnLesson | undefined {
  const url = safeUrl(href);
  const path = url?.pathname ?? href;
  const lessonId = lessonIdFromLearnPath(path);
  return lessonId ? findLesson(catalog, lessonId) : undefined;
}

export function rewriteMarkdownAssetUrl(currentLesson: LearnLesson, src: string): string {
  if (src.startsWith('https://raw.githubusercontent.com/microsoft/vscode-docs/main/')) {
    const repoRelativePath = src.replace('https://raw.githubusercontent.com/microsoft/vscode-docs/main/', '');
    return `${docsMediaRoot}/${repoRelativePath}`;
  }

  if (src.startsWith('https://github.com/microsoft/vscode-docs/blob/main/')) {
    const repoRelativePath = src.replace('https://github.com/microsoft/vscode-docs/blob/main/', '');
    return `${docsMediaRoot}/${repoRelativePath}`;
  }

  if (/^(https?:|data:)/i.test(src)) {
    return src;
  }

  if (src.startsWith('/learn/')) {
    return new URL(src, `${docsMediaRoot}/`).toString();
  }

  if (src.startsWith('/')) {
    return new URL(src, docsWebRoot).toString();
  }

  const baseDirectory = currentLesson.sourcePath.split('/').slice(0, -1).join('/');
  return new URL(src, `${docsMediaRoot}/${baseDirectory}/`).toString();
}

function safeUrl(value: string): URL | undefined {
  try {
    return new URL(value, docsWebRoot);
  } catch {
    return undefined;
  }
}
