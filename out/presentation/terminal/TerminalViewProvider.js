"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalViewProvider = void 0;
const TimelineView_1 = require("../timeline/TimelineView");
class TerminalViewProvider {
    static viewType = 'tddTerminalView';
    context;
    webviewView;
    timelineView;
    terminalPort;
    isExecuting = false;
    terminalBuffer = '';
    constructor(context, timelineView, terminalPort) {
        this.context = context;
        this.timelineView = timelineView;
        this.terminalPort = terminalPort;
        // Configurar callback directo para el output
        this.terminalPort.setOnOutputCallback((output) => {
            this.sendToTerminal(output);
        });
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
        webviewView.webview.onDidReceiveMessage(async (message) => {
            await this.handleWebviewMessage(message);
        });
        // Restaurar el buffer si existe
        if (this.terminalBuffer) {
            this.sendToTerminal(this.terminalBuffer);
        }
        else {
            // Mensaje inicial solo si no hay buffer
            this.sendToTerminal('\r\nBienvenido a la Terminal TDD\r\n$ ');
        }
        console.log('[TerminalViewProvider] Webview inicializada ✅');
    }
    async handleWebviewMessage(message) {
        switch (message.command) {
            case 'executeCommand':
                await this.executeRealCommand(message.text);
                break;
            case 'requestTimelineUpdate':
                await this.updateTimelineInWebview();
                break;
            case 'killCommand':
                this.killCurrentCommand();
                break;
            default:
                console.warn(`Comando no reconocido: ${message.command}`);
        }
    }
    async executeRealCommand(command) {
        if (this.isExecuting) {
            this.sendToTerminal('\r\n\x1b[33m⚠️  Ya hay un comando en ejecución. Espera a que termine.\x1b[0m\r\n$ ');
            return;
        }
        if (!command.trim()) {
            this.sendToTerminal('$ ');
            return;
        }
        const trimmedCommand = command.trim();
        if (trimmedCommand === 'clear') {
            this.clearTerminal();
            return;
        }
        if (trimmedCommand === 'help' || trimmedCommand === '?') {
            this.showHelp();
            return;
        }
        this.isExecuting = true;
        this.sendToTerminal(`\r\n$ ${trimmedCommand}\r\n`);
        try {
            await this.terminalPort.createAndExecuteCommand('TDDLab Terminal', trimmedCommand);
        }
        catch (error) {
            this.sendToTerminal(`\x1b[31m❌ Error ejecutando comando: ${error.message}\x1b[0m\r\n`);
        }
        finally {
            this.isExecuting = false;
            this.sendToTerminal('\r\n$ ');
        }
    }
    killCurrentCommand() {
        if (this.isExecuting && this.terminalPort.killCurrentProcess) {
            this.terminalPort.killCurrentProcess();
            this.isExecuting = false;
        }
    }
    showHelp() {
        const helpText = `\r
┌───[TDDLab - Comandos]─────────────────────────────┐\r
│                                                   │\r
│  Comandos locales:                                │\r
│    clear     - Limpiar terminal                   │\r
│    help, ?   - Mostrar esta ayuda                 │\r
│                                                   │\r
│  Comandos del sistema:                            │\r
│    Cualquier comando se ejecuta en tiempo real    │\r
│    y muestra la salida directamente aquí          │\r
│                                                   │\r
│  Control:                                         │\r
│    Ctrl+C    - Cancelar comando en ejecución      │\r
│                                                   │\r
│  Ejemplos:                                        │\r
│    npm test  - Ejecutar tests                     │\r
│    git status - Estado de Git                     │\r
│    ls -la    - Listar archivos                    │\r
│    pwd       - Directorio actual                  │\r
│                                                   │\r
└───────────────────────────────────────────────────┘\r
\r\n`;
        this.sendToTerminal(helpText);
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
        // Guardar en buffer para persistencia
        this.terminalBuffer += message;
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'writeToTerminal',
                text: message
            });
        }
    }
    executeCommand(command) {
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'executeCommand',
                text: command
            });
        }
    }
    clearTerminal() {
        this.terminalBuffer = '$ ';
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'clearTerminal'
            });
        }
    }
    // MANTENER getHtml EXACTAMENTE IGUAL - sin cambios en la estética
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
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #444;
          }
          #timeline-content {
            display: flex;
            text-align: left;
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-start;
            justify-content: flex-start;
            width: 100%;
          }
          .timeline-dot {
            display: inline-block;
          }
          #terminal {
            flex: 1 1 auto;
            text-align: left;
            width: 100%;
            height: 100%;
            overflow: hidden;
            padding: 0;
            margin: 0;
          }
          .xterm {
            width: 100% !important;
            height: 100% !important;
            text-align: left !important;
            padding: 10px !important;
            box-sizing: border-box !important;
          }
          .xterm-viewport {
            width: 100% !important;
            text-align: left !important;
          }
          .xterm-screen {
            width: 100% !important;
            text-align: left !important;
          }
          .xterm-rows {
            text-align: left !important;
            width: 100% !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
          }
          .xterm-row {
            text-align: left !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
          }
          .xterm-char {
            text-align: left !important;
          }
          #terminal > div {
            text-align: left !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
          }
          .terminal-wrapper {
            width: 100%;
            height: 100%;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div id="timeline">
          <h2>TDDLab Timeline</h2>
          <div id="timeline-content">${timelineContent}</div>
        </div>

        <div class="terminal-wrapper">
          <div id="terminal"></div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          const term = new Terminal({ 
            cursorBlink: true,
            cols: 80,
            rows: 30,
            theme: {
              background: '#1e1e1e',
              foreground: '#ffffff'
            },
            allowTransparency: false,
            convertEol: true
          });
          
          const terminalElement = document.getElementById('terminal');
          term.open(terminalElement);
          
          setTimeout(() => {
            const xtermRows = terminalElement.querySelector('.xterm-rows');
            if (xtermRows) {
              xtermRows.style.textAlign = 'left';
              xtermRows.style.paddingLeft = '0';
              xtermRows.style.marginLeft = '0';
              xtermRows.style.width = '100%';
            }
            
            const xtermScreen = terminalElement.querySelector('.xterm-screen');
            if (xtermScreen) {
              xtermScreen.style.textAlign = 'left';
              xtermScreen.style.paddingLeft = '0';
              xtermScreen.style.marginLeft = '0';
            }
          }, 100);
          
          const fitAddon = () => {
            const container = document.querySelector('.terminal-wrapper');
            if (container) {
              const width = container.offsetWidth;
              const height = container.offsetHeight;
              const cols = Math.floor((width - 20) / 9);
              const rows = Math.floor(height / 17);
              term.resize(cols, rows);
            }
          };
          
          window.addEventListener('resize', fitAddon);
          setTimeout(fitAddon, 200);
          
          term.focus();
          
          // NO escribir mensaje de bienvenida aquí - lo hará el backend
          // term.write('\\r\\nBienvenido a la Terminal TDD\\r\\n');
          // term.write('$ ');

          let command = '';
          let isExecuting = false;

          term.onData(data => {
            const code = data.charCodeAt(0);
            if (code === 13) {
              if (command.trim() && !isExecuting) {
                isExecuting = true;
                vscode.postMessage({
                  command: 'executeCommand',
                  text: command
                });
                command = '';
              } else if (!isExecuting) {
                term.write('\\r\\n$ ');
              }
            } else if (code === 127) {
              if (command.length > 0 && !isExecuting) {
                command = command.slice(0, -1);
                term.write('\\b \\b');
              }
            } else if (code === 3) {
              if (isExecuting) {
                term.write('^C');
                vscode.postMessage({
                  command: 'killCommand'
                });
                isExecuting = false;
                term.write('\\r\\n$ ');
              }
            } else if (code >= 32 && code <= 126 && !isExecuting) {
              command += data;
              term.write(data);
            }
          });
          
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateTimeline') {
              document.getElementById('timeline-content').innerHTML = message.html;
            }
            if (message.command === 'writeToTerminal') {
              const text = message.text || '';
              term.write(text);
              if (message.text === '$ ') {
                isExecuting = false;
              }
            }
            if (message.command === 'executeCommand') {
              term.write('\\r\\n$ ' + message.text + '\\r\\n');
            }
            if (message.command === 'clearTerminal') {
              term.clear();
              term.write('$ ');
              isExecuting = false;
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