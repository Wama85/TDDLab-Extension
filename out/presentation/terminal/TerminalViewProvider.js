"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalViewProvider = void 0;
const TimelineView_1 = require("../timeline/TimelineView");
class TerminalViewProvider {
    static viewType = 'tddTerminalView';
    context;
    webviewView;
    timelineView;
    constructor(context, timelineView) {
        this.context = context;
        this.timelineView = timelineView;
        TimelineView_1.TimelineView.onTimelineUpdated(async () => {
            await this.updateTimelineInWebview();
        });
    }
    async resolveWebviewView(webviewView, _context, _token) {
        this.webviewView = webviewView;
        webviewView.webview.options = { enableScripts: true };
        let timelineHtml = '<p style="color: gray;">Timeline no disponible 🚨</p>';
        try {
            timelineHtml = await this.timelineView.getTimelineHtml(webviewView.webview);
        }
        catch (err) {
            console.error('[TerminalViewProvider] Error cargando timeline:', err);
        }
        webviewView.webview.html = this.getHtml(timelineHtml);
        console.log('[TerminalViewProvider] Webview inicializada ✅');
    }
    async updateTimelineInWebview() {
        if (this.webviewView) {
            try {
                const newTimelineHtml = await this.timelineView.getTimelineHtml(this.webviewView.webview);
                this.webviewView.webview.postMessage({
                    command: 'updateTimeline',
                    html: newTimelineHtml
                });
            }
            catch (error) {
                console.error('[TerminalViewProvider] Error actualizando timeline:', error);
            }
        }
    }
    sendToTerminal(message) {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'writeToTerminal',
                text: message
            });
        }
    }
    getHtml(timelineContent) {
        const xtermCssUri = 'https://cdn.jsdelivr.net/npm/xterm/css/xterm.css';
        const xtermJsUri = 'https://cdn.jsdelivr.net/npm/xterm/lib/xterm.js';
        return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Terminal TDD</title>
        <link rel="stylesheet" href="${xtermCssUri}">
        <script src="${xtermJsUri}"></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            font-family: monospace;
            background: #1e1e1e;
            color: #eee;
          }
          #timeline {
            flex: 0 0 auto;
            background-color: #222;
            color: #eee;
            padding: 10px;
            border-bottom: 1px solid #444;
          }
          #timeline-content {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
          }
          .timeline-dot {
            display: inline-block;
          }
          #terminal {
            flex: 1 1 auto;
          }
        </style>
      </head>
      <body>
        <div id="timeline">
          <h2>TDDLab Timeline</h2>
          <div id="timeline-content">${timelineContent}</div>
        </div>

        <div id="terminal"></div>

        <script>
          const term = new Terminal({ cursorBlink: true });
          term.open(document.getElementById('terminal'));
          term.focus();
          document.getElementById('terminal').focus();
          term.write('🚀 Bienvenido a la Terminal TDD\\r\\n$ ');

          let command = '';
          const prompt = () => term.write('\\r\\n$ ');

          term.onData(data => {
            const code = data.charCodeAt(0);
            if (code === 13) {
              handleCommand(command.trim());
              command = '';
            } else if (code === 127) {
              if (command.length > 0) {
                command = command.slice(0, -1);
                term.write('\\b \\b');
              }
            } else if (code >= 32 && code <= 126) {
              command += data;
              term.write(data);
            }
          });

          function handleCommand(cmd) {
            switch (cmd) {
              case 'help':
                term.write('\\r\\nComandos: help, clear, echo, about');
                break;
              case 'clear':
                term.clear();
                break;
              case 'about':
                term.write('\\r\\nEsta es una consola simulada hecha con xterm.js');
                break;
              default:
                if (cmd.startsWith('echo ')) {
                  term.write('\\r\\n' + cmd.slice(5));
                } else {
                  term.write('\\r\\nComando no reconocido: ' + cmd);
                }
                break;
            }
            prompt();
          }

          // 🔹 Escuchar mensajes del backend
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateTimeline') {
              document.getElementById('timeline-content').innerHTML = message.html;
            }
            if (message.command === 'writeToTerminal') {
              term.write('\\r\\n' + message.text);
            }
          });
        </script>
      </body>
      </html>
    `;
    }
}
exports.TerminalViewProvider = TerminalViewProvider;
//# sourceMappingURL=TerminalViewProvider.js.map