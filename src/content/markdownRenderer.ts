import MarkdownIt from 'markdown-it';
import type { LearnCatalog, LearnLesson } from '../catalog/types';
import { resolveLearnLink, rewriteMarkdownAssetUrl } from '../catalog/linkMapper';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

export function renderLessonMarkdown(catalog: LearnCatalog, lesson: LearnLesson, rawMarkdown: string): string {
  const withoutFrontmatter = rawMarkdown.replace(/^---[\s\S]*?---\s*/, '');
  const extractedMedia = extractHtmlMedia(lesson, withoutFrontmatter);
  const rendered = markdown.render(extractedMedia.markdown);
  const rewritten = rewriteRenderedHtml(catalog, lesson, rendered);
  return injectHtmlMedia(rewritten, extractedMedia.replacements);
}

function rewriteRenderedHtml(catalog: LearnCatalog, lesson: LearnLesson, html: string): string {
  return html
    .replace(/<a href="([^"]+)"/g, (_match, href: string) => {
      const mappedLesson = resolveLearnLink(catalog, href);
      if (mappedLesson) {
        return `<a href="command:vscodeLearn.openLesson?${encodeURIComponent(JSON.stringify([mappedLesson.id]))}"`;
      }
      if (href.startsWith('/')) {
        return `<a href="https://code.visualstudio.com${href}"`;
      }
      return `<a href="${escapeAttribute(href)}"`;
    })
    .replace(/<img src="([^"]+)"/g, (_match, src: string) => `<img src="${escapeAttribute(rewriteMarkdownAssetUrl(lesson, src))}"`);
}

function extractHtmlMedia(lesson: LearnLesson, markdownContent: string): { markdown: string; replacements: string[] } {
  const replacements: string[] = [];
  const withImages = markdownContent.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const src = readAttribute(imgTag, 'src');
    if (!src) {
      return imgTag;
    }

    const rewrittenSrc = rewriteMarkdownAssetUrl(lesson, src);
    const alt = readAttribute(imgTag, 'alt');
    const title = readAttribute(imgTag, 'title');
    const attrs = [
      `src="${escapeAttribute(rewrittenSrc)}"`,
      alt ? `alt="${escapeAttribute(alt)}"` : '',
      title ? `title="${escapeAttribute(title)}"` : ''
    ].filter(Boolean).join(' ');

    const imageHtml = `<img ${attrs}>`;
    const index = replacements.push(imageHtml) - 1;
    return `\n\nMEDIA_PLACEHOLDER_${index}\n\n`;
  });

  const markdown = withImages.replace(/<iframe[\s\S]*?<\/iframe>/gi, (iframe) => {
    const src = readAttribute(iframe, 'src');
    if (!src) {
      return iframe;
    }

    const video = getYouTubeVideo(src);
    if (!video) {
      return iframe;
    }

    const thumbnail = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
    const openCommandUri = `command:vscodeLearn.openVideo?${encodeURIComponent(JSON.stringify([video.watchUrl]))}`;
    const embedHtml = `<a class="video-card" href="${escapeAttribute(openCommandUri)}" title="Watch on YouTube">
  <img class="video-thumb" src="${escapeAttribute(thumbnail)}" alt="YouTube video thumbnail">
  <span class="video-play" aria-hidden="true"></span>
  <span class="video-label">Watch video on YouTube</span>
</a>`;
    const index = replacements.push(embedHtml) - 1;
    return `\n\nMEDIA_PLACEHOLDER_${index}\n\n`;
  });

  return { markdown, replacements };
}

function injectHtmlMedia(html: string, replacements: string[]): string {
  let updated = html;
  for (let index = 0; index < replacements.length; index += 1) {
    const token = `MEDIA_PLACEHOLDER_${index}`;
    const asParagraph = `<p>${token}</p>`;
    updated = updated.replace(asParagraph, replacements[index]).replace(token, replacements[index]);
  }
  return updated;
}

function readAttribute(htmlTag: string, attribute: string): string | undefined {
  const pattern = new RegExp(`${attribute}=(?:"([^"]+)"|'([^']+)')`, 'i');
  const match = pattern.exec(htmlTag);
  return match?.[1] ?? match?.[2];
}

function getYouTubeVideo(value: string): { id: string; watchUrl: string; embedUrl: string } | undefined {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') {
      return undefined;
    }

    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const isYouTubeHost = host === 'youtube.com' || host === 'youtube-nocookie.com' || host === 'youtu.be';
    if (!isYouTubeHost) {
      return undefined;
    }

    let id: string | undefined;
    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0];
    } else if (parsed.pathname.startsWith('/embed/')) {
      id = parsed.pathname.slice('/embed/'.length).split('/')[0];
    } else if (parsed.pathname === '/watch') {
      id = parsed.searchParams.get('v') ?? undefined;
    }

    if (!id || !/^[\w-]{11}$/.test(id)) {
      return undefined;
    }

    return {
      id,
      watchUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
    };
  } catch {
    return undefined;
  }
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
