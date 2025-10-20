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
const ExecuteCloneCommand_1 = require("./application/clone/ExecuteCloneCommand");
let terminalProvider = null;
let timelineView = null;
let testMenuProvider = null;
async function activate(context) {
    //  Crear TimelineView primero
    timelineView = new TimelineView_1.TimelineView(context);
    //  Crear TerminalViewProvider con TimelineView
    terminalProvider = new TerminalViewProvider_1.TerminalViewProvider(context, timelineView);
    //  Crear el menú de opciones TDD
    testMenuProvider = new TestMenuProvider_1.TestMenuProvider();
    //  Crear instancias para ejecutar tests y clonar proyecto
    const runTests = new NpmRunTests_1.NpmRunTests(terminalProvider);
    const executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(runTests);
    const executeCloneCommand = new ExecuteCloneCommand_1.ExecuteCloneCommand(); // Ya no necesita tddBasePath
    //  Botón/Comando Run Test
    const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
        try {
            if (!terminalProvider) {
                vscode.window.showErrorMessage('Terminal no disponible');
                return;
            }
            //  Primero abrimos/mostramos la terminal TDD
            await vscode.commands.executeCommand('tddTerminalView.focus');
            //  Mostrar el comando en la terminal con línea en blanco
            terminalProvider.sendToTerminal('$ npm run test');
            terminalProvider.sendToTerminal('');
            //  Ejecutar los tests (esto enviará la salida a la terminal)
            await executeTestCommand.execute();
        }
        catch (error) {
            const msg = `❌ Error ejecutando tests: ${error.message}`;
            if (terminalProvider) {
                terminalProvider.sendToTerminal(msg);
            }
            else {
                vscode.window.showErrorMessage(msg);
            }
        }
    });
    //  Comando Clear Terminal
    const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
        if (terminalProvider) {
            terminalProvider.clearTerminal();
        }
    });
    //  Comando Crear Proyecto (ahora clona desde Git)
    const cloneProjectCmd = vscode.commands.registerCommand('TDD.cloneCommand', async () => {
        try {
            await executeCloneCommand.execute(); // Ya no necesita parámetros
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error al crear el proyecto: ${error.message}`);
        }
    });
    //  Comando Show Timeline (abre la Terminal TDD que contiene el timeline)
    const showTimelineCmd = vscode.commands.registerCommand('extension.showTimeline', async () => {
        try {
            // Abrir la vista de la Terminal TDD donde está el Timeline
            await vscode.commands.executeCommand('tddTerminalView.focus');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error al mostrar timeline: ${error.message}`);
        }
    });
    context.subscriptions.push(runTestCmd, clearTerminalCmd, cloneProjectCmd, showTimelineCmd);
    //  Registrar el menú de opciones TDD
    context.subscriptions.push(vscode.window.registerTreeDataProvider('tddTestExecution', testMenuProvider));
    //  Registrar Terminal TDDLab (incluye el Timeline integrado)
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(TerminalViewProvider_1.TerminalViewProvider.viewType, terminalProvider));
}
function deactivate() {
    terminalProvider = null;
    timelineView = null;
    testMenuProvider = null;
}
//# sourceMappingURL=extension.js.map