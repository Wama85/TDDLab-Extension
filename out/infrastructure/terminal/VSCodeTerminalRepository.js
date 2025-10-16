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
exports.VSCodeTerminalRepository = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class VSCodeTerminalRepository {
    getTerminalByName(name) {
        return vscode.window.terminals.find(terminal => terminal.name === name);
    }
    async createAndExecuteCommand(terminalName, command) {
        try {
            console.log(`[VSCodeTerminalRepository] Executing: ${command}`);
            // Obtener el workspace actual
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
            const { stdout, stderr } = await execAsync(command, {
                cwd: cwd,
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            let terminal = this.getTerminalByName(terminalName);
            if (!terminal) {
                terminal = vscode.window.createTerminal({
                    name: terminalName,
                    cwd: cwd
                });
            }
            terminal.show();
            terminal.sendText(command);
            return { output: stdout, error: stderr };
        }
        catch (error) {
            console.error(`[VSCodeTerminalRepository] Error executing command: ${error}`);
            const terminal = vscode.window.createTerminal({
                name: terminalName,
            });
            terminal.show();
            terminal.sendText(`echo "Error: ${error.message}"`);
            return {
                output: '',
                error: error.stderr || error.message || `Error ejecutando comando: ${command}`
            };
        }
    }
}
exports.VSCodeTerminalRepository = VSCodeTerminalRepository;
//# sourceMappingURL=VSCodeTerminalRepository.js.map