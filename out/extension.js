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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ExecuteTestCommand_1 = require("./application/runTest/ExecuteTestCommand");
const NpmRunTests_1 = require("./infrastructure/test/NpmRunTests");
const TerminalViewProvider_1 = require("./presentation/terminal/TerminalViewProvider");
const TimelineView_1 = require("./presentation/timeline/TimelineView");
const TestMenuProvider_1 = require("./presentation/menu/TestMenuProvider");
const VSCodeTerminalRepository_1 = require("./infrastructure/terminal/VSCodeTerminalRepository");
const ExecuteCloneCommand_1 = require("./application/clone/ExecuteCloneCommand");
let terminalProvider = null;
let timelineView = null;
let testMenuProvider = null;
async function activate(context) {
    console.log('TDDLab extension is activating...');
    //trrtrtrt
    try {
        timelineView = new TimelineView_1.TimelineView(context);
        const terminalPort = new VSCodeTerminalRepository_1.VSCodeTerminalRepository();
        terminalProvider = new TerminalViewProvider_1.TerminalViewProvider(context, timelineView, terminalPort);
        testMenuProvider = new TestMenuProvider_1.TestMenuProvider();
        const runTests = new NpmRunTests_1.NpmRunTests(terminalProvider);
        const executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(runTests);
        const executeCloneCommand = new ExecuteCloneCommand_1.ExecuteCloneCommand();
        // Registrar comandos
        const cmds = [
            vscode.commands.registerCommand('TDD.runTest', async () => {
                if (!terminalProvider) {
                    vscode.window.showErrorMessage('Terminal no disponible');
                    return;
                }
                await vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.executeCommand('npm test');
            }),
            vscode.commands.registerCommand('TDD.clearTerminal', () => terminalProvider?.clearTerminal()),
            vscode.commands.registerCommand('TDD.cloneCommand', async () => {
                try {
                    await executeCloneCommand.execute();
                }
                catch (e) {
                    vscode.window.showErrorMessage(`Error al crear proyecto: ${e.message}`);
                }
            }),
            vscode.commands.registerCommand('extension.showTimeline', () => vscode.commands.executeCommand('tddTerminalView.focus')),
            vscode.commands.registerCommand('TDD.runCypress', () => {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider?.executeCommand('npx cypress run');
            }),
            vscode.commands.registerCommand('TDD.gitStatus', () => {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider?.executeCommand('git status');
            }),
            vscode.commands.registerCommand('TDD.npmInstall', () => {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider?.executeCommand('npm install');
            }),
            // 💬 Chat IA - VERSIÓN MEJORADA
            vscode.commands.registerCommand('TDD.openChat', () => {
                try {
                    const panel = vscode.window.createWebviewPanel('tddChat', '🧠 TDD Assistant Chat', // Mejor título
                    vscode.ViewColumn.Two, {
                        enableScripts: true,
                        retainContextWhenHidden: true, // ✅ Mantiene el estado
                        localResourceRoots: [] // ✅ Seguridad
                    });
                    panel.webview.html = getChatHtml();
                    // ✅ Manejar cuando se cierra el panel
                    panel.onDidDispose(() => {
                        console.log('TDD Chat panel closed');
                    }, null, context.subscriptions);
                }
                catch (error) {
                    vscode.window.showErrorMessage(`❌ Error abriendo TDD Assistant: ${error}`);
                }
            })
        ];
        context.subscriptions.push(...cmds);
        // Registrar menú lateral
        context.subscriptions.push(vscode.window.registerTreeDataProvider('tddTestExecution', testMenuProvider));
        // Registrar vista de terminal
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(TerminalViewProvider_1.TerminalViewProvider.viewType, terminalProvider));
        console.log('TDDLab extension activated ✅');
    }
    catch (error) {
        console.error('Error activating TDDLab extension:', error);
        vscode.window.showErrorMessage(`Error activating TDDLab: ${error}`);
    }
}
function getChatHtml() {
    const webhookUrl = 'https://marlon8n.app.n8n.cloud/webhook/9dbbe983-f9a8-400b-8df8-ab429611850e/chat';
    return `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Asistente IA TDD</title>
        <link href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css" rel="stylesheet" />
        <style>
            body {
                padding: 0;
                margin: 0;
                background: transparent;
                height: 100vh;
                overflow: hidden;
            }
            #chat-container {
                height: 100vh;
                width: 100%;
                border-radius: 8px;
            }
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: var(--vscode-foreground);
                font-family: var(--vscode-font-family);
            }
            .welcome-message {
                padding: 20px;
                text-align: center;
                color: var(--vscode-descriptionForeground);
                font-family: var(--vscode-font-family);
            }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <div class="loading" id="loading">
                <div>
                    <div class="welcome-message">
                        <h3>🤖 Asistente IA TDD</h3>
                        <p>Inicializando chat...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script type="module">
            import { createChat } from 'https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js';

            let chatInstance = null;
            const chatContainer = document.getElementById('chat-container');
            const loadingElement = document.getElementById('loading');

            // Configuración del chat
            const chatConfig = {
                webhookUrl: '${webhookUrl}',
                target: '#chat-container',
                mode: 'bubble',
                welcomeMessage: '¡Hola! Soy tu asistente especializado en TDD. ¿En qué puedo ayudarte con tus tests?',

                theme: {
                    light: {
                        primary: '#007ACC',
                        secondary: '#FFFFFF',
                        text: '#333333',
                    },
                    dark: {
                        primary: '#007ACC',
                        secondary: '#1E1E1E',
                        text: '#CCCCCC',
                    }
                },
                chatInput: {
                    placeholder: 'Pregunta sobre TDD, tests, o tu código...',
                    enabled: true
                },
                initialMessages: [
                    'Puedo ayudarte a:',
                    '• Escribir tests unitarios',
                    '• Explicar conceptos de TDD', 
                    '• Revisar tu código de test',
                    '• Sugerir mejoras en tus tests',
                    '• Resolver problemas con frameworks de testing'
                ]
            };

            // Inicializar el chat
            function initializeChat() {
                try {
                    chatInstance = createChat(chatConfig);
                    
                    // Ocultar loading cuando el chat esté listo
                    setTimeout(() => {
                        if (loadingElement) {
                            loadingElement.style.display = 'none';
                        }
                    }, 1000);

                    console.log('Chat TDD inicializado correctamente');
                } catch (error) {
                    console.error('Error al inicializar el chat:', error);
                    if (loadingElement) {
                        loadingElement.innerHTML = '<div class="welcome-message"><h3>❌ Error</h3><p>No se pudo cargar el chat. Verifica la conexión.</p></div>';
                    }
                }
            }

            // Escuchar mensajes de VSCode
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'focusChat':
                        // Enfocar el input del chat cuando se solicite
                        setTimeout(() => {
                            const chatInput = document.querySelector('[data-test-id="chat-input"]') || 
                                            document.querySelector('input[placeholder*="Pregunta"]');
                            if (chatInput) {
                                chatInput.focus();
                            }
                        }, 300);
                        break;
                }
            });

            // Inicializar cuando el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeChat);
            } else {
                initializeChat();
            }

            // Notificar a VSCode que el chat está listo
            setTimeout(() => {
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    type: 'chatReady',
                    ready: true
                });
            }, 2000);
        </script>
    </body>
    </html>`;
}
function deactivate() {
    terminalProvider = null;
    timelineView = null;
    testMenuProvider = null;
}
//# sourceMappingURL=extension.js.map