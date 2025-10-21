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
    return /*html*/ `
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asistente TDD</title>
      <style>
          * {
              box-sizing: border-box;
          }
          body { 
              margin: 0; 
              padding: 0; 
              height: 100vh; 
              background: #1e1e1e; 
              color: #cccccc;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              flex-direction: column;
              overflow: hidden;
          }
          .chat-header {
              background: #2d2d2d;
              padding: 12px 20px;
              border-bottom: 1px solid #444;
              flex-shrink: 0;
          }
          .chat-header h3 {
              margin: 0;
              font-size: 16px;
              font-weight: 600;
          }
          .messages-container {
              flex: 1;
              overflow-y: auto;
              padding: 15px;
              display: flex;
              flex-direction: column;
              gap: 8px;
          }
          .input-area {
              padding: 15px 20px;
              border-top: 1px solid #444;
              background: #252526;
              flex-shrink: 0;
          }
          .input-wrapper {
              display: flex;
              gap: 10px;
              align-items: flex-end;
              max-width: 100%;
          }
          input {
              flex: 1;
              padding: 10px 14px;
              background: #2d2d2d;
              border: 1px solid #444;
              color: #cccccc;
              border-radius: 6px;
              font-size: 14px;
              min-height: 40px;
          }
          input:focus {
              outline: 1px solid #007acc;
              border-color: #007acc;
          }
          button {
              padding: 10px 20px;
              background: #007acc;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              min-height: 40px;
              transition: background 0.2s;
          }
          button:hover {
              background: #005a9e;
          }
          button:disabled {
              opacity: 0.6;
              cursor: not-allowed;
          }

          /* 🎨 ESTILOS MEJORADOS PARA MENSAJES */
          .message {
              max-width: 85%;
              word-wrap: break-word;
              line-height: 1.4;
              position: relative;
          }

          /* 🔵 MENSAJE DEL USUARIO - MÁS COMPACTO */
          .user-message {
              align-self: flex-end;
              background: #007acc;
              color: white;
              padding: 8px 12px;
              border-radius: 12px 12px 4px 12px;
              margin: 2px 0;
              font-size: 14px;
              max-width: 70%; /* 🔥 Más compacto */
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          }

          /* ⚪ MENSAJE DEL BOT - MÁS GRANDE */
          .bot-message {
              align-self: flex-start;
              background: #2d2d2d;
              border: 1px solid #444;
              padding: 12px 16px;
              border-radius: 12px 12px 12px 4px;
              margin: 2px 0;
              font-size: 14px;
              max-width: 100%; /* 🔥 Más ancho */
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }

          /* 📝 MEJORAS DE TEXTO */
          .bot-message {
              line-height: 1.5;
              white-space: pre-wrap;
          }

          .user-message {
              line-height: 1.3;
          }

          /* 🔄 ESTADO DE TYPING */
          .typing-indicator {
              align-self: flex-start;
              background: #2d2d2d;
              border: 1px solid #444;
              padding: 12px 16px;
              border-radius: 12px 12px 12px 4px;
              color: #888;
              font-style: italic;
              font-size: 14px;
              max-width: 200px;
          }

          /* 📱 MEJORAS DE SCROLL */
          .messages-container::-webkit-scrollbar {
              width: 6px;
          }
          .messages-container::-webkit-scrollbar-track {
              background: #1e1e1e;
          }
          .messages-container::-webkit-scrollbar-thumb {
              background: #444;
              border-radius: 3px;
          }
          .messages-container::-webkit-scrollbar-thumb:hover {
              background: #555;
          }

          /* 🎯 MENSAJE DE BIENVENIDA ESPECIAL */
          .welcome-message {
              align-self: flex-start;
              background: #2d2d2d;
              border: 1px solid #010304ff;
              padding: 16px 20px;
              border-radius: 12px;
              margin: 10px 0;
              font-size: 14px;
              line-height: 1.5;
              max-width: 95%;
              text-align: center;
          }

          .debug {
              background: #004d00;
              color: #00ff00;
              padding: 8px 15px;
              font-size: 11px;
              border-bottom: 1px solid #444;
              flex-shrink: 0;
          }
      </style>
  </head>
  <body>
      <div class="debug" id="debug">💬 TDD Assistant - Conectando...</div>
      <div class="chat-header">
          <h3>🧠 Asistente TDD</h3>
      </div>
      <div class="messages-container" id="messages">
          <div class="welcome-message">
              ¡Hola! Soy tu asistente especializado en TDD. 
              Puedo ayudarte con pruebas unitarias, Jest, Cypress, 
              desarrollo guiado por tests y mejores prácticas.
          </div>
      </div>
      <div class="input-area">
          <div class="input-wrapper">
              <input type="text" id="userInput" placeholder="Escribe tu pregunta sobre TDD..." />
              <button id="sendButton" onclick="sendMessage()">Enviar</button>
          </div>
      </div>

      <script>
          const webhookUrl = '${webhookUrl}';
          const messagesDiv = document.getElementById('messages');
          const userInput = document.getElementById('userInput');
          const sendButton = document.getElementById('sendButton');
          const debugDiv = document.getElementById('debug');

          function updateDebug(message) {
              debugDiv.textContent = '🔧 ' + message;
              console.log('🔧', message);
          }

          function addMessage(text, isUser = false) {
              const messageDiv = document.createElement('div');
              messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
              
              // Formatear texto manteniendo saltos de línea
              messageDiv.innerHTML = text.replace(/\n/g, '<br>');
              
              messagesDiv.appendChild(messageDiv);
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function showTyping() {
              const typingDiv = document.createElement('div');
              typingDiv.className = 'typing-indicator';
              typingDiv.id = 'typing';
              typingDiv.textContent = 'El asistente está escribiendo...';
              messagesDiv.appendChild(typingDiv);
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }

          function hideTyping() {
              const typingDiv = document.getElementById('typing');
              if (typingDiv) {
                  typingDiv.remove();
              }
          }

          async function sendMessage() {
              const message = userInput.value.trim();
              if (!message) return;

              addMessage(message, true);
              userInput.value = '';
              sendButton.disabled = true;
              
              showTyping();
              updateDebug('Enviando mensaje...');

              try {
                  const response = await fetch(webhookUrl, {
                      method: 'POST',
                      headers: { 
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                      },
                      body: JSON.stringify({ 
                          message: message,
                          language: 'es',
                          context: 'tdd',
                          timestamp: new Date().toISOString()
                      })
                  });

                  updateDebug('Respuesta: ' + response.status);

                  if (response.ok) {
                      const data = await response.json();
                      console.log('🔧 Respuesta completa:', data);
                      
                      let botResponse = data.response || data.message || data.text || 
                                      data.answer || data.reply ||
                                      '✅ Recibí tu mensaje. ¿En qué más puedo ayudarte con TDD?';
                      
                      addMessage(botResponse);
                      updateDebug('Mensaje procesado ✓');
                  } else {
                      const errorText = await response.text();
                      addMessage('❌ Error del servidor. Intenta nuevamente.');
                      updateDebug('Error HTTP: ' + response.status);
                      console.error('🔧 Error response:', errorText);
                  }
              } catch (error) {
                  addMessage('❌ Error de conexión. Verifica tu internet.');
                  updateDebug('Error de red: ' + error.message);
                  console.error('🔧 Network error:', error);
              } finally {
                  hideTyping();
                  sendButton.disabled = false;
                  userInput.focus();
              }
          }

          // Event listeners
          userInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
              }
          });

          // Auto-focus y limpiar placeholder al escribir
          userInput.focus();
          userInput.addEventListener('input', () => {
              if (userInput.value.trim()) {
                  userInput.placeholder = '';
              } else {
                  userInput.placeholder = 'Escribe tu pregunta sobre TDD...';
              }
          });

          updateDebug('Listo - Escribe tu mensaje');
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