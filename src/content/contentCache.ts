import * as vscode from 'vscode';

export interface CachedLessonContent {
  readonly markdown: string;
  readonly fetchedAt: number;
  readonly etag?: string;
}

export class ContentCache {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async read(lessonId: string): Promise<CachedLessonContent | undefined> {
    const metadata = this.context.globalState.get<Record<string, Omit<CachedLessonContent, 'markdown'>>>('vscodeLearn.contentMetadata', {});
    const entry = metadata[lessonId];
    if (!entry) {
      return undefined;
    }

    try {
      const uri = this.contentUri(lessonId);
      const bytes = await vscode.workspace.fs.readFile(uri);
      return { ...entry, markdown: Buffer.from(bytes).toString('utf8') };
    } catch (error) {
      throw new Error(`Cached lesson content metadata exists but content file is unreadable for ${lessonId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async write(lessonId: string, markdown: string, etag?: string): Promise<CachedLessonContent> {
    const content = { markdown, fetchedAt: Date.now(), etag };
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(this.context.globalStorageUri, 'content'));
    await vscode.workspace.fs.writeFile(this.contentUri(lessonId), Buffer.from(markdown, 'utf8'));
    const metadata = this.context.globalState.get<Record<string, Omit<CachedLessonContent, 'markdown'>>>('vscodeLearn.contentMetadata', {});
    metadata[lessonId] = { fetchedAt: content.fetchedAt, etag };
    await this.context.globalState.update('vscodeLearn.contentMetadata', metadata);
    return content;
  }

  private contentUri(lessonId: string): vscode.Uri {
    return vscode.Uri.joinPath(this.context.globalStorageUri, 'content', `${lessonId.replace(/[^\w.-]+/g, '__')}.md`);
  }
}
