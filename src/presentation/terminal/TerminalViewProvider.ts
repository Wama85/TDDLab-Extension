import * as vscode from 'vscode';
import { TimelineView } from '../timeline/TimelineView';
import { TerminalPort } from '../../domain/model/TerminalPort';

export class TerminalViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'tddTerminalView';
  private readonly context: vscode.ExtensionContext;
  private webviewView?: vscode.WebviewView;
  private readonly timelineView: TimelineView;
  private readonly terminalPort: TerminalPort;

  constructor(context: vscode.ExtensionContext, timelineView: TimelineView, terminalPort: TerminalPort) {
    this.context = context;
    this.timelineView = timelineView;
    this.terminalPort = terminalPort;

    TimelineView.onTimelineUpdated(async () => {
      await this.updateTimelineInWebview();
    });
  }

  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.webviewView = webviewView;
    webviewView.webview.options = { enableScripts: true };

    let timelineHtml = '<p style="color: gray;">Timeline no disponible 🚨</p>';
    try {
      timelineHtml = await this.timelineView.getTimelineHtml(webviewView.webview);
    } catch (err) {
      console.error('[TerminalViewProvider] Error cargando timeline:', err);
    }

    webviewView.webview.html = this.getHtml(timelineHtml);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.handleWebviewMessage(message);
    });

    console.log('[TerminalViewProvider] Webview inicializada ✅');
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.command) {
      case 'executeCommand':
        await this.executeRealCommand(message.text);
        break;
      
      case 'requestTimelineUpdate':
        await this.updateTimelineInWebview();
        break;
      
      case 'runTddTest':
        await this.executeRealCommand('npm test');
        break;
      
      case 'runCypress':
        await this.executeRealCommand('npx cypress run');
        break;
      
      case 'gitStatus':
        await this.executeRealCommand('git status');
        break;
      
      case 'npmInstall':
        await this.executeRealCommand('npm install');
        break;
      
      default:
        console.warn(`Comando no reconocido: ${message.command}`);
    }
  }

  public async executeRealCommand(command: string): Promise<void> {
    if (!command.trim()) {
      this.sendToTerminal('$ ');
      return;
    }

    const trimmedCommand = command.trim();
    
    // Comandos especiales que se ejecutan localmente
    if (trimmedCommand === 'clear') {
      this.clearTerminal();
      return;
    }
    
    if (trimmedCommand === 'help' || trimmedCommand === '?') {
      this.showHelp();
      return;
    }
    
    if (trimmedCommand === 'pwd') {
      this.showCurrentDirectory();
      return;
    }

    if (trimmedCommand === 'ls' || trimmedCommand === 'dir') {
      await this.listDirectory();
      return;
    }

    // Mostrar comando en terminal web con formato mejorado
    this.sendToTerminal(`\r\n┌───[TDDLab]──────────────────────────────────────────┐\r\n`);
    this.sendToTerminal(`│ Comando: ${trimmedCommand.padEnd(40)} │\r\n`);
    this.sendToTerminal(`└────────────────────────────────────────────────────────┘\r\n`);

    try {
      // Ejecutar comando y capturar output
      const result = await this.terminalPort.createAndExecuteCommand('TDDLab Terminal', trimmedCommand);

      // Mostrar output en terminal web
      if (result.output) {
        this.sendToTerminal(result.output);
        if (!result.output.endsWith('\n')) {
          this.sendToTerminal('\r\n');
        }
      }

      // Mostrar errores en terminal web
      if (result.error && result.error.trim()) {
        this.sendToTerminal(`\x1b[31m${result.error}\x1b[0m`); // Rojo para errores
        if (!result.error.endsWith('\n')) {
          this.sendToTerminal('\r\n');
        }
      }

      // Mostrar estado del comando
      if (result.error && !result.output) {
        this.sendToTerminal('\x1b[33m⚠️  Comando completado con errores\x1b[0m\r\n');
      } else if (result.output || !result.error) {
        this.sendToTerminal('\x1b[32m✅ Comando ejecutado correctamente\x1b[0m\r\n');
      }

    } catch (error: any) {
      this.sendToTerminal(`\x1b[31m❌ Error ejecutando comando: ${error.message}\x1b[0m\r\n`);
    }

    // Mostrar prompt
    this.sendToTerminal('\r\n$ ');
  }

  private showHelp(): void {
    const helpText = `
┌───[TDDLab - Comandos]─────────────────────────────┐
│                                                   │
│  \x1b[36mComandos locales:\x1b[0m                                │
│    clear     - Limpiar terminal                   │
│    help, ?   - Mostrar esta ayuda                 │
│    pwd       - Mostrar directorio actual          │
│    ls, dir   - Listar archivos                    │
│                                                   │
│  \x1b[36mComandos en sistema:\x1b[0m                             │
│    Cualquier otro comando se ejecuta en           │
│    el sistema y muestra la salida aquí            │
│                                                   │
│  \x1b[36mComandos TDD:\x1b[0m                                    │
│    npm test  - Ejecutar tests                     │
│    npm run   - Ejecutar script npm                │
│    git       - Comandos de Git                    │
│                                                   │
│  \x1b[36mAtajos:\x1b[0m                                          │
│    Ctrl+C    - Cancelar comando actual            │
│    Tab       - Autocompletar (próximamente)       │
│                                                   │
└───────────────────────────────────────────────────┘
\r\n
`;
    this.sendToTerminal(helpText);
  }

  private showCurrentDirectory(): void {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const currentDir = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
    this.sendToTerminal(`\x1b[36m${currentDir}\x1b[0m\r\n\r\n`);
  }

  private async listDirectory(): Promise<void> {
    try {
      const result = await this.terminalPort.createAndExecuteCommand('TDDLab Terminal', 'ls -la');
      if (result.output) {
        this.sendToTerminal(result.output);
      }
      if (result.error && !result.output) {
        // Si ls -la falla, intentar con dir (Windows)
        const winResult = await this.terminalPort.createAndExecuteCommand('TDDLab Terminal', 'dir');
        if (winResult.output) {
          this.sendToTerminal(winResult.output);
        }
      }
    } catch (error: any) {
      this.sendToTerminal(`\x1b[31mError listando directorio: ${error.message}\x1b[0m\r\n`);
    }
  }

  private async updateTimelineInWebview() {
    if (this.webviewView) {
      try {
        const newTimelineHtml = await this.timelineView.getTimelineHtml(this.webviewView.webview);
        this.webviewView.webview.postMessage({
          command: 'updateTimeline',
          html: newTimelineHtml
        });
      } catch (error) {
        console.error('[TerminalViewProvider] Error actualizando timeline:', error);
      }
    }
  }

  public sendToTerminal(message: string) {
    if (this.webviewView) {
      const text = message.endsWith('\r\n') ? message.slice(0, -2) : message;
      this.webviewView.webview.postMessage({
        command: 'writeToTerminal',
        text: text
      });
    }
  }

  public executeCommand(command: string) {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({
        command: 'executeCommand',
        text: command
      });
    }
  }

  public clearTerminal() {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({
        command: 'clearTerminal'
      });
    }
  }

  private getHtml(timelineContent: string): string {
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
          const vscode = acquireVsCodeApi();
          
          const term = new Terminal({ 
            cursorBlink: true,
            cols: 80,
            rows: 30,
            theme: {
              background: '#1e1e1e',
              foreground: '#ffffff',
              cursor: '#ffffff',
              selection: '#264f78'
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
          
          term.write('\\r\\nBienvenido a la Terminal TDD\\r\\n');
          term.write('$ ');

          let command = '';
          const prompt = () => term.write('\\r\\n$ ');

          term.onData(data => {
            const code = data.charCodeAt(0);
            if (code === 13) {
              if (command.trim()) {
                vscode.postMessage({
                  command: 'executeCommand',
                  text: command
                });
              }
              command = '';
              prompt();
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

          window.addEventListener('message', event => {
          const message = event.data;
          if (message.command === 'updateTimeline') {
            document.getElementById('timeline-content').innerHTML = message.html;
          }
          if (message.command === 'writeToTerminal') {
            const text = message.text || '';
            // Escribir el texto directamente - xterm.js maneja los códigos ANSI
            term.write(text);
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