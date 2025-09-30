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
class TimelineView {
    context;
    currentWebview = null;
    getTimeline;
    getLastPoint;
    // EventEmitter para notificar cambios en el timeline
    static _onTimelineUpdated = new vscode.EventEmitter();
    static onTimelineUpdated = TimelineView._onTimelineUpdated.event;
    // Cache del timeline para detectar cambios
    lastTimelineData = [];
    constructor(context) {
        this.context = context;
        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.getTimeline = new GetTimeline_1.GetTimeline(rootPath);
        this.getLastPoint = new GetLastPoint_1.GetLastPoint(context);
        // Iniciar el polling para detectar cambios
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
            // Actualizar cache y notificar si hay cambios
            this.updateTimelineCache(timeline);
        }
        catch (err) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`Error al mostrar la línea de tiempo: ${err.message}`);
            }
            else {
                vscode.window.showErrorMessage(`Error desconocido al mostrar la línea de tiempo`);
            }
        }
    }
    async getTimelineHtml(webview) {
        try {
            const timeline = await this.getTimeline.execute();
            return this.generateHtmlFragment(timeline, webview);
        }
        catch (err) {
            if (err instanceof Error) {
                vscode.window.showErrorMessage(`Error al cargar la línea de tiempo: ${err.message}`);
                console.error('[TimelineView] getTimelineHtml error:', err);
            }
            else {
                vscode.window.showErrorMessage(`Error desconocido al cargar la línea de tiempo.`);
                console.error('[TimelineView] getTimelineHtml unknown error:', err);
            }
            return `<p style="color: red;">Error al cargar la línea de tiempo</p>`;
        }
    }
    startTimelinePolling() {
        setInterval(async () => {
            try {
                const currentTimeline = await this.getTimeline.execute();
                // Verificar si hay cambios comparando con el cache
                if (this.hasTimelineChanged(currentTimeline)) {
                    this.updateTimelineCache(currentTimeline);
                    // Actualizar el webview principal si existe
                    if (this.currentWebview) {
                        this.currentWebview.html = this.generateHtml(currentTimeline, this.currentWebview);
                    }
                }
            }
            catch (err) {
                console.error('[TimelineView] Error en polling:', err);
            }
        }, 2000); // Verificar cada 2 segundos
    }
    // Método para verificar si el timeline ha cambiado
    hasTimelineChanged(newTimeline) {
        if (newTimeline.length !== this.lastTimelineData.length) {
            return true;
        }
        // Comparación simple por longitud y últimos elementos
        for (let i = 0; i < newTimeline.length; i++) {
            const newItem = newTimeline[i];
            const oldItem = this.lastTimelineData[i];
            if (newItem instanceof Timeline_1.Timeline && oldItem instanceof Timeline_1.Timeline) {
                if (newItem.numPassedTests !== oldItem.numPassedTests ||
                    newItem.numTotalTests !== oldItem.numTotalTests ||
                    newItem.timestamp.getTime() !== oldItem.timestamp.getTime()) {
                    return true;
                }
            }
            else if (newItem instanceof CommitPoint_1.CommitPoint && oldItem instanceof CommitPoint_1.CommitPoint) {
                if (newItem.commitName !== oldItem.commitName ||
                    newItem.commitTimestamp.getTime() !== oldItem.commitTimestamp.getTime()) {
                    return true;
                }
            }
            else if (newItem.constructor !== oldItem.constructor) {
                return true;
            }
        }
        return false;
    }
    // Método para actualizar el cache y notificar cambios
    updateTimelineCache(timeline) {
        this.lastTimelineData = [...timeline]; // Crear copia del array
        // Emitir evento de actualización
        TimelineView._onTimelineUpdated.fire(timeline);
    }
    lastTestPoint(timeline) {
        for (let i = timeline.length - 1; i >= 0; i--) {
            if (timeline[i] instanceof Timeline_1.Timeline && timeline[i] !== undefined) {
                return timeline[i];
            }
        }
        return undefined;
    }
    generateHtmlFragment(timeline, webview) {
        const gitLogoUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'images', 'git.png'));
        const regex = /refactor/i;
        return timeline.slice().reverse().map(point => {
            if (point instanceof Timeline_1.Timeline) {
                const color = point.getColor();
                const date = point.timestamp.toLocaleDateString('es-Es', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const time = point.timestamp.toLocaleTimeString();
                return `
                    <div class="timeline-dot" style="margin: 3px; background-color: ${color}; width: 25px; height: 25px; border-radius: 50px;">
                        <span class="popup">
                            <strong>Pruebas:</strong> ${point.numPassedTests}/${point.numTotalTests}<br>
                            <strong>Fecha:</strong> ${date}<br>
                            <strong>Hora:</strong> ${time}
                        </span>
                    </div>
                `;
            }
            else if (point instanceof CommitPoint_1.CommitPoint) {
                let htmlPoint = '';
                const date = point.commitTimestamp.toLocaleDateString('es-Es', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const time = point.commitTimestamp.toLocaleTimeString();
                htmlPoint += `
                    <div class="timeline-dot">
                        <img src="${gitLogoUri}" style="margin: 3px; width: 25px; height: 25px; border-radius: 50px;">
                        <span class="popup">
                            <strong>Nombre:</strong> ${point.commitName ?? ''}<br>
                            <strong>Fecha:</strong> ${date} ${time}
                        </span>
                    </div>
                `;
                if (point.commitName && regex.test(point.commitName)) {
                    htmlPoint += `
                        <div class="timeline-dot" style="margin: 3px; background-color: skyblue; width: 25px; height: 25px; border-radius: 50px;">
                            <span class="popup">
                                <center><strong>Punto de Refactoring</strong></center>
                            </span>
                        </div>
                    `;
                }
                return htmlPoint;
            }
            return '';
        }).join('');
    }
    generateHtml(timeline, webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css'));
        const timelineHtml = this.generateHtmlFragment(timeline, webview);
        const lastPoint = this.lastTestPoint(timeline);
        if (lastPoint !== undefined) {
            this.getLastPoint.execute(lastPoint.getColor());
        }
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Línea de Tiempo</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <h2>TDDLab Timeline</h2>
                <div style="display: flex; flex-wrap: wrap;">
                    ${timelineHtml}
                </div>
            </body>
            </html>
        `;
    }
}
exports.TimelineView = TimelineView;
//# sourceMappingURL=TimelineView.js.map