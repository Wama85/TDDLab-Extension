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
        // Crear TimelineView primero
        timelineView = new TimelineView_1.TimelineView(context);
        // Crear VSCodeTerminalRepository
        const terminalPort = new VSCodeTerminalRepository_1.VSCodeTerminalRepository();
        // Crear TerminalViewProvider con TimelineView
        terminalProvider = new TerminalViewProvider_1.TerminalViewProvider(context, timelineView, terminalPort);
        // Crear el menú de opciones TDD
        testMenuProvider = new TestMenuProvider_1.TestMenuProvider();
        // Crear instancias para ejecutar tests y clonar proyecto
        const runTests = new NpmRunTests_1.NpmRunTests(terminalProvider);
        const executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(runTests);
        const executeCloneCommand = new ExecuteCloneCommand_1.ExecuteCloneCommand();
        // Comando Run Test
        const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
            try {
                if (!terminalProvider) {
                    vscode.window.showErrorMessage('Terminal no disponible');
                    return;
                }
                await vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.executeCommand('npm test');
            }
            catch (error) {
                const msg = `❌ Error ejecutando tests: ${error.message}`;
                vscode.window.showErrorMessage(msg);
            }
        });
        // Comando Clear Terminal
        const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
            if (terminalProvider) {
                terminalProvider.clearTerminal();
            }
        });
        // Comando Crear Proyecto
        const cloneProjectCmd = vscode.commands.registerCommand('TDD.cloneCommand', async () => {
            try {
                await executeCloneCommand.execute();
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error al crear el proyecto: ${error.message}`);
            }
        });
        // Comando Show Timeline (abre la Terminal TDD que contiene el timeline)
        const showTimelineCmd = vscode.commands.registerCommand('extension.showTimeline', async () => {
            try {
                await vscode.commands.executeCommand('tddTerminalView.focus');
            }
            catch (error) {
                vscode.window.showErrorMessage(`Error al mostrar timeline: ${error.message}`);
            }
        });
        // Comando Run Cypress
        const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', () => {
            if (terminalProvider) {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.executeCommand('npx cypress run');
            }
        });
        // Comando Git Status
        const gitStatusCmd = vscode.commands.registerCommand('TDD.gitStatus', () => {
            if (terminalProvider) {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.executeCommand('git status');
            }
        });
        // Comando NPM Install
        const npmInstallCmd = vscode.commands.registerCommand('TDD.npmInstall', () => {
            if (terminalProvider) {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.executeCommand('npm install');
            }
        });
        // Registrar todos los comandos
        context.subscriptions.push(runTestCmd, clearTerminalCmd, cloneProjectCmd, showTimelineCmd, runCypressCmd, gitStatusCmd, npmInstallCmd);
        // Registrar el menú de opciones TDD
        context.subscriptions.push(vscode.window.registerTreeDataProvider('tddTestExecution', testMenuProvider));
        // Registrar Terminal TDDLab (incluye el Timeline integrado)
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(TerminalViewProvider_1.TerminalViewProvider.viewType, terminalProvider));
        console.log('TDDLab extension activated ✅');
    }
    catch (error) {
        console.error('Error activating TDDLab extension:', error);
        vscode.window.showErrorMessage(`Error activating TDDLab: ${error}`);
    }
}
function deactivate() {
    terminalProvider = null;
    timelineView = null;
    testMenuProvider = null;
}
//# sourceMappingURL=extension.js.map