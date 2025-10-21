"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineView = void 0;
const vscode = __importStar(require("vscode"));
const GetTimeline_1 = require("../../application/timeline/GetTimeline");
const GetLastPoint_1 = require("../../application/timeline/GetLastPoint");
const Timeline_1 = require("../../domain/timeline/Timeline");
const CommitPoint_1 = require("../../domain/timeline/CommitPoint");
const path = __importStar(require("path"));
class TimelineView {
    constructor(context) {
        this.currentWebview = null;
        this.lastTimelineData = [];
        this.context = context;
        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.getTimeline = new GetTimeline_1.GetTimeline(rootPath);
        this.getLastPoint = new GetLastPoint_1.GetLastPoint(context);
        this.startTimelinePolling();
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = { enableScripts: true };
        this.currentWebview = webviewView.webview;
        this.showTimeline(this.currentWebview);
    }
    async showTimeline(webview) {
        try {
            const timeline = await this.getTimeline.execute();
            webview.html = this.generateHtml(timeline, webview);
            this.updateTimelineCache(timeline);
        }
        catch (err) {
            webview.html = `<h2>TDDLab Timeline</h2>
                      <p style="color:gray;">⚠️ Timeline no disponible</p>
                      <p style="color:#666;font-size:12px;">Ejecuta tests para ver el timeline</p>`;
            console.debug('[TimelineView] Timeline no disponible (esperado en proyectos sin tests)');
        }
    }
    async getTimelineHtml(webview) {
        try {
            const timeline = await this.getTimeline.execute();
            return this.generateHtmlFragment(timeline, webview);
        }
        catch (err) {
            console.debug('[TimelineView] Timeline no disponible');
            return `<p style="color:#666;font-size:12px;">Sin timeline disponible</p>`;
        }
    }
    startTimelinePolling() {
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 3;
        setInterval(async () => {
            try {
                const currentTimeline = await this.getTimeline.execute();
                consecutiveErrors = 0;
                if (this.hasTimelineChanged(currentTimeline)) {
                    this.updateTimelineCache(currentTimeline);
                    if (this.currentWebview) {
                        this.currentWebview.postMessage({
                            command: 'updateTimeline',
                            html: this.generateHtmlFragment(currentTimeline, this.currentWebview),
                        });
                    }
                }
            }
            catch (err) {
                consecutiveErrors++;
                if (consecutiveErrors === maxConsecutiveErrors) {
                    console.debug('[TimelineView] Timeline no disponible en este proyecto');
                }
            }
        }, 4000);
    }
    hasTimelineChanged(newTimeline) {
        return JSON.stringify(newTimeline) !== JSON.stringify(this.lastTimelineData);
    }
    updateTimelineCache(timeline) {
        this.lastTimelineData = [...timeline];
        TimelineView._onTimelineUpdated.fire(timeline);
    }
    generateHtmlFragment(timeline, webview) {
        const gitLogoUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionUri.fsPath, 'images', 'git.png')));
        const regex = /refactor/i;
        return timeline
            .slice()
            .reverse()
            .map((point) => {
            if (point instanceof Timeline_1.Timeline) {
                const color = point.getColor();
                return `<div class="timeline-dot" style="margin:3px;background:${color};width:20px;height:20px;border-radius:50%;"></div>`;
            }
            else if (point instanceof CommitPoint_1.CommitPoint) {
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
    generateHtml(timeline, webview) {
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
exports.TimelineView = TimelineView;
TimelineView._onTimelineUpdated = new vscode.EventEmitter();
TimelineView.onTimelineUpdated = TimelineView._onTimelineUpdated.event;
//# sourceMappingURL=TimelineView.js.map