import * as vscode from 'vscode';
import type { LearnCatalog, LearnCourse } from './types';

const repository = 'microsoft/vscode-docs';

interface TocCourse {
  readonly name: string;
  readonly area: string;
  readonly description?: string;
  readonly topics: readonly (readonly [string, string])[];
}

export class GitHubDocsSource {
  constructor(private readonly branch: string) {}

  async fetchCatalog(): Promise<LearnCatalog> {
    const tocUrl = `https://raw.githubusercontent.com/${repository}/${this.branch}/learn/toc.json`;
    const response = await fetch(tocUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch VS Code Learn catalog: ${response.status} ${response.statusText}`);
    }

    const etag = response.headers.get('etag') ?? undefined;
    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('VS Code Learn catalog response was not an array.');
    }

    const seenLessons = new Set<string>();
    const courses: LearnCourse[] = body.map((course: TocCourse, courseIndex) => {
      if (!course.name || !course.area || !Array.isArray(course.topics)) {
        throw new Error(`Invalid course entry at index ${courseIndex}.`);
      }

      return {
        id: course.area,
        title: course.name,
        description: course.description ?? '',
        area: course.area,
        order: courseIndex,
        lessons: course.topics.map((topic, lessonIndex) => {
          const [title, learnPath] = topic;
          const prefix = `/learn/${course.area}/`;
          if (!learnPath.startsWith(prefix)) {
            throw new Error(`Unexpected lesson path "${learnPath}" for course "${course.name}".`);
          }

          const slug = learnPath.slice(prefix.length);
          const id = `${course.area}/${slug}`;
          if (seenLessons.has(id)) {
            throw new Error(`Duplicate lesson id "${id}" in remote catalog.`);
          }
          seenLessons.add(id);

          return {
            id,
            courseId: course.area,
            title,
            area: course.area,
            slug,
            order: lessonIndex,
            sourcePath: `learn/${course.area}/${slug}.md`,
            canonicalUrl: `https://code.visualstudio.com${learnPath}`,
            rawMarkdownUrl: `https://raw.githubusercontent.com/${repository}/${this.branch}/learn/${course.area}/${slug}.md`
          };
        })
      };
    });

    return {
      source: {
        repository,
        branch: this.branch,
        tocUrl,
        fetchedAt: new Date().toISOString(),
        etag
      },
      courses
    };
  }

  static fromConfiguration(): GitHubDocsSource {
    const branch = vscode.workspace.getConfiguration('vscodeLearn').get<string>('sync.branch', 'main');
    return new GitHubDocsSource(branch);
  }
}
