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
      if (isFileNotFound(error)) {
        const nextMetadata = { ...metadata };
        delete nextMetadata[lessonId];
        try {
          await this.context.globalState.update('vscodeLearn.contentMetadata', nextMetadata);
        } catch (metadataError) {
          throw new Error(
            `Cached lesson content metadata is stale for ${lessonId}, and metadata cleanup failed: ${messageFromError(metadataError)}`
          );
        }
        return undefined;
      }

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

  async clear(): Promise<void> {
    await this.context.globalState.update('vscodeLearn.contentMetadata', {});
    const contentRoot = vscode.Uri.joinPath(this.context.globalStorageUri, 'content');
    try {
      await vscode.workspace.fs.delete(contentRoot, { recursive: true, useTrash: false });
    } catch (error) {
      if (!isFileNotFound(error)) {
        throw error;
      }
    }
  }

  private contentUri(lessonId: string): vscode.Uri {
    return vscode.Uri.joinPath(this.context.globalStorageUri, 'content', `${lessonId.replace(/[^\w.-]+/g, '__')}.md`);
  }
}

function isFileNotFound(error: unknown): boolean {
  if (error instanceof vscode.FileSystemError) {
    return error.code === 'FileNotFound';
  }
  if (error instanceof Error) {
    return error.message.includes('nonexistent file') || error.message.includes('FileNotFound');
  }
  return false;
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
