import * as vscode from 'vscode';
import { GetTimeline } from '../../application/timeline/GetTimeline';
import { GetLastPoint } from '../../application/timeline/GetLastPoint';
import { Timeline } from '../../domain/timeline/Timeline';
import { CommitPoint } from '../../domain/timeline/CommitPoint';

export class TimelineView implements vscode.WebviewViewProvider {
  private readonly context: vscode.ExtensionContext;
  public currentWebview: vscode.Webview | null = null;
  private readonly getTimeline: GetTimeline;
  private readonly getLastPoint: GetLastPoint;

  private static _onTimelineUpdated: vscode.EventEmitter<
    Array<Timeline | CommitPoint>
  > = new vscode.EventEmitter<Array<Timeline | CommitPoint>>();
  public static readonly onTimelineUpdated: vscode.Event<
    Array<Timeline | CommitPoint>
  > = TimelineView._onTimelineUpdated.event;

  private lastTimelineData: Array<Timeline | CommitPoint> = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    this.getTimeline = new GetTimeline(rootPath);
    this.getLastPoint = new GetLastPoint(context);

    this.startTimelinePolling();
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = { enableScripts: true };
    this.currentWebview = webviewView.webview;
    this.showTimeline(this.currentWebview);
  }

  async showTimeline(webview: vscode.Webview): Promise<void> {
    try {
      const timeline = await this.getTimeline.execute();
      webview.html = this.generateHtml(timeline, webview);
      this.updateTimelineCache(timeline);
    } catch (err) {
      webview.html = `<h2>TDDLab Timeline</h2>
                      <p style="color:gray;">⚠️ Timeline no disponible aún</p>`;
      console.warn('[TimelineView] Error inicial (ignorado):', err);
    }
  }

  public async getTimelineHtml(webview: vscode.Webview): Promise<string> {
    try {
      const timeline = await this.getTimeline.execute();
      return this.generateHtmlFragment(timeline, webview);
    } catch (err) {
      console.warn('[TimelineView] getTimelineHtml error (ignorado):', err);
      return `<p style="color:gray;">⚠️ No se pudo refrescar el timeline</p>`;
    }
  }

  private startTimelinePolling(): void {
    setInterval(async () => {
      try {
        const currentTimeline = await this.getTimeline.execute();
        if (this.hasTimelineChanged(currentTimeline)) {
          this.updateTimelineCache(currentTimeline);

          if (this.currentWebview) {
            this.currentWebview.postMessage({
              command: 'updateTimeline',
              html: this.generateHtmlFragment(currentTimeline, this.currentWebview),
            });
          }
        }
      } catch (err) {
        // 👇 no mostrar popup, solo aviso en consola
        console.warn('[TimelineView] Polling error (ignorado):', err);
      }
    }, 4000);
  }

  private hasTimelineChanged(newTimeline: Array<Timeline | CommitPoint>): boolean {
    return JSON.stringify(newTimeline) !== JSON.stringify(this.lastTimelineData);
  }

  private updateTimelineCache(timeline: Array<Timeline | CommitPoint>): void {
    this.lastTimelineData = [...timeline];
    TimelineView._onTimelineUpdated.fire(timeline);
  }

  private generateHtmlFragment(
    timeline: Array<Timeline | CommitPoint>,
    webview: vscode.Webview
  ): string {
    const gitLogoUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'images', 'git.png')
    );
    const regex = /refactor/i;

    return timeline
      .slice()
      .reverse()
      .map((point) => {
        if (point instanceof Timeline) {
          const color = point.getColor();
          return `<div class="timeline-dot" style="margin:3px;background:${color};width:20px;height:20px;border-radius:50%;"></div>`;
        } else if (point instanceof CommitPoint) {
          let htmlPoint = `
            <div class="timeline-dot">
              <img src="${gitLogoUri}" style="margin:3px;width:20px;height:20px;border-radius:50%;">
            </div>
          `;
          if (point.commitName && regex.test(point.commitName)) {
            htmlPoint += `<div class="timeline-dot" style="margin:3px;background:skyblue;width:20px;height:20px;border-radius:50%;"></div>`;
          }
          return htmlPoint;
        }
        return '';
      })
      .join('');
  }

  private generateHtml(
    timeline: Array<Timeline | CommitPoint>,
    webview: vscode.Webview
  ): string {
    const timelineHtml = this.generateHtmlFragment(timeline, webview);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { background:#1e1e1e; color:#eee; font-family:monospace; }
          .timeline-dot { display:inline-block; }
          #timeline-content { 
            display:flex;
            flex-direction:row;
            flex-wrap:wrap;
            align-items:center;
          }
        </style>
      </head>
      <body>
        <h2>TDDLab Timeline</h2>
        <div id="timeline-content">
          ${timelineHtml}
        </div>
        <script>
          window.addEventListener('message', event => {
            if (event.data.command === 'updateTimeline') {
              document.getElementById('timeline-content').innerHTML = event.data.html;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}