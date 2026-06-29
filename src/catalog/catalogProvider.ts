import * as vscode from 'vscode';
import { generatedLearnCatalog } from '../generated/learnCatalog.generated';
import { GitHubDocsSource } from './githubDocsSource';
import type { LearnCatalog } from './types';

const remoteCatalogKey = 'vscodeLearn.remoteCatalog';
const lastSyncAttemptKey = 'vscodeLearn.lastCatalogSyncAttempt';

export class CatalogProvider {
  private catalog: LearnCatalog;
  private readonly changeEmitter = new vscode.EventEmitter<LearnCatalog>();
  readonly onDidChangeCatalog = this.changeEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.catalog = context.globalState.get<LearnCatalog>(remoteCatalogKey) ?? generatedLearnCatalog;
  }

  getCatalog(): LearnCatalog {
    return this.catalog;
  }

  async refresh(showSuccessMessage: boolean): Promise<LearnCatalog> {
    const source = GitHubDocsSource.fromConfiguration();
    const catalog = await source.fetchCatalog();
    await this.context.globalState.update(remoteCatalogKey, catalog);
    await this.context.globalState.update(lastSyncAttemptKey, Date.now());
    this.catalog = catalog;
    this.changeEmitter.fire(catalog);
    if (showSuccessMessage) {
      vscode.window.showInformationMessage(`VS Code Learn catalog refreshed: ${catalog.courses.length} courses.`);
    }
    return catalog;
  }

  async refreshIfDue(): Promise<void> {
    const config = vscode.workspace.getConfiguration('vscodeLearn');
    if (!config.get<boolean>('sync.enabled', true)) {
      return;
    }

    const intervalHours = config.get<number>('sync.intervalHours', 24);
    const lastAttempt = this.context.globalState.get<number>(lastSyncAttemptKey, 0);
    if (Date.now() - lastAttempt < intervalHours * 60 * 60 * 1000) {
      return;
    }

    try {
      await this.refresh(false);
    } catch (error) {
      await this.context.globalState.update(lastSyncAttemptKey, Date.now());
      vscode.window.showWarningMessage(`Unable to refresh VS Code Learn catalog. Using cached catalog. ${messageFromError(error)}`);
    }
  }
}

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
