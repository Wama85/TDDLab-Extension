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
            // No agregar \r\n si el mensaje ya lo tiene al final
            const text = message.endsWith('\r\n') ? message.slice(0, -2) : message;
            this.webviewView.webview.postMessage({
                command: 'writeToTerminal',
                text: text
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
        if (this.webviewView) {
            this.webviewView.webview.postMessage({
                command: 'clearTerminal'
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
        /* Forzar alineación izquierda en todos los elementos del terminal */
        #terminal > div {
          text-align: left !important;
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        /* Estilos adicionales para el prompt */
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
        const term = new Terminal({ 
          cursorBlink: true,
          cols: 80,
          rows: 30,
          theme: {
            background: '#1e1e1e',
            foreground: '#ffffff'
          },
          // Configuración adicional para forzar alineación
          allowTransparency: false,
          convertEol: true
        });
        
        const terminalElement = document.getElementById('terminal');
        term.open(terminalElement);
        
        // Forzar estilos de alineación después de la inicialización
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
        
        // Ajustar el ancho del terminal al contenedor
        const fitAddon = () => {
          const container = document.querySelector('.terminal-wrapper');
          if (container) {
            const width = container.offsetWidth;
            const height = container.offsetHeight;
            const cols = Math.floor((width - 20) / 9); // Restar padding
            const rows = Math.floor(height / 17);
            term.resize(cols, rows);
          }
        };
        
        window.addEventListener('resize', fitAddon);
        setTimeout(fitAddon, 200);
        
        term.focus();
        
        // Escribir mensaje de bienvenida
        term.write('\\r\\nBienvenido a la Terminal TDD\\r\\n');
        term.write('$ ');

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
              term.write('\\r\\nComandos: help, clear, echo, about, test');
              break;
            case 'clear':
              term.clear();
              term.write('$ ');
              break;
            case 'about':
              term.write('\\r\\nEsta es una consola simulada hecha con xterm.js');
              break;
            case 'test':
            case 'npm test':
            case 'npm run test':
              term.write('\\r\\n🧪 Ejecutando tests...');
              // Aquí podrías agregar lógica para ejecutar tests reales
              break;
            default:
              if (cmd.startsWith('echo ')) {
                term.write('\\r\\n' + cmd.slice(5));
              } else if (cmd) {
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
            const text = message.text || '';
            // Forzar alineación izquierda para cada línea
            const lines = text.split('\\n');
            lines.forEach((line, index) => {
              term.write(line);
              if (index < lines.length - 1) {
                term.write('\\r\\n');
              }
            });
            term.write('\\r\\n');
          }
          if (message.command === 'executeCommand') {
            term.write('\\r\\n$ ' + message.text + '\\r\\n');
          }
          if (message.command === 'clearTerminal') {
            term.clear();
            term.write('$ ');
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