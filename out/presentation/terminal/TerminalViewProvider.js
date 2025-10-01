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
    currentDirectory;
    isExecuting = false;
    constructor(context, timelineView, terminalPort) {
        this.context = context;
        this.timelineView = timelineView;
        this.terminalPort = terminalPort;
        this.currentDirectory = terminalPort.getCurrentDirectory();
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
        console.log('[TerminalViewProvider] Webview inicializada ✅');
    }
    async handleWebviewMessage(message) {
        switch (message.command) {
            case 'executeCommand':
                await this.executeCommand(message.text);
                break;
            case 'requestTimelineUpdate':
                await this.updateTimelineInWebview();
                break;
            case 'runTddTest':
                await this.executeCommand('npm run test');
                break;
            case 'runCypress':
                await this.executeCommand('npx cypress run');
                break;
            case 'gitStatus':
                await this.executeCommand('git status');
                break;
            case 'npmInstall':
                await this.executeCommand('npm install');
                break;
        }
    }
    async executeCommand(command) {
        if (this.isExecuting) {
            this.sendToTerminal('\r\n⚠️  Ya hay un comando en ejecución. Espera a que termine.\r\n$ ');
            return;
        }
        if (!command.trim()) {
            this.sendToTerminal('\r\n$ ');
            return;
        }
        this.isExecuting = true;
        // Mostrar el comando en la terminal
        this.sendToTerminal(`\r\n$ ${command}\r\n`);
        // Comandos especiales
        if (command.trim() === 'clear') {
            this.sendToTerminal({ command: 'clearTerminal' });
            this.isExecuting = false;
            return;
        }
        if (command.trim().startsWith('cd ')) {
            const path = command.trim().substring(3).trim();
            const success = await this.terminalPort.changeDirectory(path);
            if (success) {
                this.currentDirectory = this.terminalPort.getCurrentDirectory();
                this.sendToTerminal(`Directorio cambiado a: ${this.currentDirectory}\r\n`);
            }
            else {
                this.sendToTerminal(`Error: No se pudo cambiar al directorio '${path}'\r\n`);
            }
            this.sendToTerminal('$ ');
            this.isExecuting = false;
            return;
        }
        // Ejecutar comando REAL con streaming
        try {
            await this.terminalPort.executeCommandWithStream(command, (output) => {
                this.sendToTerminal(output);
            }, (error) => {
                this.sendToTerminal(error);
            });
        }
        catch (error) {
            this.sendToTerminal(`❌ Error ejecutando comando: ${error.message}\r\n`);
        }
        this.sendToTerminal('$ ');
        this.isExecuting = false;
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
            if (typeof message === 'string') {
                this.webviewView.webview.postMessage({
                    command: 'writeToTerminal',
                    text: message
                });
            }
            else {
                this.webviewView.webview.postMessage(message);
            }
        }
    }
    dispose() {
        // No hay recursos que liberar
    }
    getHtml(timelineContent) {
        const xtermCssUri = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css';
        const xtermJsUri = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js';
        const fitAddonUri = 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js';
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terminal TDDLab - Real</title>
    <link rel="stylesheet" href="${xtermCssUri}">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            display: flex;
            flex-direction: column;
            font-family: 'Cascadia Code', 'Courier New', monospace;
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
            padding: 10px;
        }
        .status-bar {
            flex: 0 0 auto;
            background: #2d2d30;
            padding: 8px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            border-top: 1px solid #444;
            color: #ccc;
        }
        .status-connected { color: #4ec9b0; }
        .status-disconnected { color: #f44747; }
        .xterm .xterm-screen canvas { 
            border-radius: 4px;
        }
        .controls {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            flex-wrap: wrap;
        }
        .control-btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        .control-btn:hover {
            background: #005a9e;
        }
        .control-btn.cypress {
            background: #5a2770;
        }
        .control-btn.test {
            background: #166c3b;
        }
        .control-btn.git {
            background: #f14e32;
        }
        .directory-info {
            font-size: 11px;
            color: #888;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div id="timeline">
        <h2>🧪 TDDLab Timeline</h2>
        <div id="timeline-content">${timelineContent}</div>
        <div class="controls">
            <button class="control-btn test" onclick="vscodePostMessage('runTddTest')">Run npm test</button>
            <button class="control-btn cypress" onclick="vscodePostMessage('runCypress')">Run Cypress</button>
            <button class="control-btn git" onclick="vscodePostMessage('gitStatus')">Git Status</button>
            <button class="control-btn" onclick="vscodePostMessage('npmInstall')">npm install</button>
            <button class="control-btn" onclick="executeCommand('node --version')">Node Version</button>
            <button class="control-btn" onclick="executeCommand('ls -la')">List Files</button>
            <button class="control-btn" onclick="executeCommand('pwd')">Show Directory</button>
        </div>
        <div class="directory-info" id="directory-info">
            Directorio: ${this.currentDirectory}
        </div>
    </div>

    <div id="terminal"></div>

    <div class="status-bar">
        <div id="status" class="status-connected">🟢 Terminal TDDLab - Comandos REALES</div>
        <div>Ejecuta: node, npm, git, cypress, etc. | Escribe comandos directamente</div>
    </div>

    <script src="${xtermJsUri}"></script>
    <script src="${fitAddonUri}"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let currentDirectory = '${this.currentDirectory}';
        
        function vscodePostMessage(command, data = {}) {
            vscode.postMessage({ command, ...data });
        }

        function executeCommand(command) {
            vscodePostMessage('executeCommand', { text: command });
        }

        function updateDirectoryInfo() {
            document.getElementById('directory-info').textContent = 'Directorio: ' + currentDirectory;
        }

        class RealTerminal {
            constructor() {
                this.term = null;
                this.fitAddon = null;
                this.currentLine = '';
                this.isExecuting = false;
                
                this.initializeTerminal();
                this.setupEventListeners();
            }
            
            initializeTerminal() {
                this.term = new Terminal({
                    cursorBlink: true,
                    fontSize: 14,
                    fontFamily: "'Cascadia Code', 'Courier New', monospace",
                    theme: {
                        background: '#1e1e1e',
                        foreground: '#cccccc',
                        cursor: '#ffffff',
                        selection: '#264f78'
                    }
                });
                
                this.fitAddon = new FitAddon.FitAddon();
                this.term.loadAddon(this.fitAddon);
                
                this.term.open(document.getElementById('terminal'));
                this.fitAddon.fit();
                
                this.term.writeln('🚀 Terminal TDDLab - Comandos REALES');
                this.term.writeln('Todos los comandos se ejecutan en tu sistema');
                this.term.writeln('Usa "cd [directorio]" para cambiar de carpeta');
                this.term.writeln('Usa "clear" para limpiar la terminal');
                this.term.write('\\r\\n$ ');
                
                window.addEventListener('resize', () => {
                    this.fitAddon.fit();
                });
            }
            
            setupEventListeners() {
                this.term.onData(data => {
                    const code = data.charCodeAt(0);
                    
                    if (code === 13) { // Enter
                        const command = this.currentLine.trim();
                        if (command && !this.isExecuting) {
                            this.isExecuting = true;
                            vscodePostMessage('executeCommand', { text: command });
                            this.currentLine = '';
                        } else if (!this.isExecuting) {
                            this.term.write('\\r\\n$ ');
                        }
                    } else if (code === 127) { // Backspace
                        if (this.currentLine.length > 0 && !this.isExecuting) {
                            this.currentLine = this.currentLine.slice(0, -1);
                            this.term.write('\\b \\b');
                        }
                    } else if (code === 3) { // Ctrl+C
                        if (this.isExecuting) {
                            this.term.write('^C');
                            this.isExecuting = false;
                            this.term.write('\\r\\n$ ');
                        }
                    } else if (code >= 32 && code <= 126 && !this.isExecuting) { // Caracteres normales
                        this.currentLine += data;
                        this.term.write(data);
                    }
                });
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateTimeline':
                            document.getElementById('timeline-content').innerHTML = message.html;
                            break;
                        case 'writeToTerminal':
                            this.term.write(message.text);
                            if (message.text === '$ ') {
                                this.isExecuting = false;
                            }
                            break;
                        case 'clearTerminal':
                            this.term.clear();
                            this.term.write('$ ');
                            this.isExecuting = false;
                            break;
                    }
                });
            }
        }
        
        new RealTerminal();
        updateDirectoryInfo();
    </script>
</body>
</html>`;
    }
}
exports.TerminalViewProvider = TerminalViewProvider;
//# sourceMappingURL=TerminalViewProvider.js.map