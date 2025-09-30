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
const vscode = __importStar(require("vscode"));
const VSCodeTerminalRepository_1 = require("./infrastructure/terminal/VSCodeTerminalRepository");
const NpmRunTests_1 = require("./infrastructure/test/NpmRunTests");
const ExecuteTestCommand_1 = require("./application/runTest/ExecuteTestCommand");
const TerminalViewProvider_1 = require("./presentation/terminal/TerminalViewProvider");
async function activate(context) {
    const terminalRepo = new VSCodeTerminalRepository_1.VSCodeTerminalRepository();
    const runTests = new NpmRunTests_1.NpmRunTests(terminalRepo);
    const executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(runTests);
    const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
        const results = await executeTestCommand.execute();
        vscode.window.showInformationMessage(`Tests ejecutados: ${results.length}`);
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(TerminalViewProvider_1.TerminalViewProvider.viewType, new TerminalViewProvider_1.TerminalViewProvider(context)));
}
//# sourceMappingURL=extension.js.map