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
const RealCommandExecutor_1 = require("./infrastructure/terminal/RealCommandExecutor");
let terminalProvider = null;
let timelineView = null;
async function activate(context) {
    console.log('TDDLab extension is activating...');
    try {
        // 🔹 Crear TimelineView primero
        timelineView = new TimelineView_1.TimelineView(context);
        // 🔹 Crear el ejecutor de comandos REALES (ÚNICA IMPLEMENTACIÓN)
        const terminalPort = new RealCommandExecutor_1.RealCommandExecutor();
        // 🔹 Crear TerminalViewProvider
        terminalProvider = new TerminalViewProvider_1.TerminalViewProvider(context, timelineView, terminalPort);
        // 🔹 Crear instancias para ejecutar tests
        const runTests = new NpmRunTests_1.NpmRunTests(terminalProvider);
        const _executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(runTests);
        // 🔹 Comandos
        const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
            if (terminalProvider) {
                await vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.sendToTerminal('npm run test\r\n');
            }
        });
        const openTerminalCmd = vscode.commands.registerCommand('TDD.openTerminal', () => {
            vscode.commands.executeCommand('tddTerminalView.focus');
        });
        const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', () => {
            if (terminalProvider) {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.sendToTerminal('npx cypress run\r\n');
            }
        });
        context.subscriptions.push(runTestCmd, openTerminalCmd, runCypressCmd);
        // 🔹 Registrar vistas
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(TerminalViewProvider_1.TerminalViewProvider.viewType, terminalProvider));
        context.subscriptions.push(vscode.window.registerWebviewViewProvider('tddTimelineView', timelineView));
        console.log('TDDLab extension activated ✅');
    }
    catch (error) {
        console.error('Error activating TDDLab extension:', error);
        vscode.window.showErrorMessage(`Error activating TDDLab: ${error}`);
    }
}
function deactivate() {
    if (terminalProvider) {
        terminalProvider.dispose();
    }
    terminalProvider = null;
    timelineView = null;
}
//# sourceMappingURL=extension.js.map