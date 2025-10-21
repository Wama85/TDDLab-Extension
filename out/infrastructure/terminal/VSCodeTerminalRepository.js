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
class VSCodeTerminalRepository {
    constructor() {
        this.currentProcess = null;
        this.onOutputCallback = null;
        this.isExecuting = false;
        this.outputChannel = vscode.window.createOutputChannel('TDDLab Commands');
    }
    setOnOutputCallback(callback) {
        this.onOutputCallback = callback;
    }
    async createAndExecuteCommand(terminalName, command) {
        // Si ya está ejecutando, no hacer nada
        if (this.isExecuting) {
            return;
        }
        this.isExecuting = true;
        return new Promise((resolve) => {
            try {
                this.outputChannel.appendLine(`[${new Date().toISOString()}] Executing: ${command}`);
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
                const [cmd, ...args] = this.parseCommand(command);
                this.currentProcess = (0, child_process_1.spawn)(cmd, args, {
                    cwd: cwd,
                    shell: true,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                this.currentProcess.stdout?.on('data', (data) => {
                    const output = data.toString();
                    this.outputChannel.append(output);
                    if (this.onOutputCallback) {
                        this.onOutputCallback(output);
                    }
                });
                this.currentProcess.stderr?.on('data', (data) => {
                    const error = data.toString();
                    this.outputChannel.append(error);
                    if (this.onOutputCallback) {
                        this.onOutputCallback(error);
                    }
                });
                this.currentProcess.on('close', (code) => {
                    this.outputChannel.appendLine(`\nCommand exited with code: ${code}`);
                    // IMPORTANTE: Resetear estado ANTES de enviar callbacks
                    this.currentProcess = null;
                    this.isExecuting = false;
                    if (this.onOutputCallback) {
                        if (code === 0) {
                            this.onOutputCallback(`\r\n✅ Comando ejecutado correctamente\r\n`);
                        }
                        else {
                            this.onOutputCallback(`\r\n❌ Comando falló con código: ${code}\r\n`);
                        }
                        // Enviar prompt DESPUÉS de resetear estado
                        this.onOutputCallback('$ ');
                    }
                    resolve();
                });
                this.currentProcess.on('error', (error) => {
                    this.outputChannel.appendLine(`Process error: ${error.message}`);
                    // IMPORTANTE: Resetear estado ANTES de enviar callbacks
                    this.currentProcess = null;
                    this.isExecuting = false;
                    if (this.onOutputCallback) {
                        this.onOutputCallback(`\r\n❌ Error ejecutando comando: ${error.message}\r\n$ `);
                    }
                    resolve();
                });
            }
            catch (error) {
                this.outputChannel.appendLine(`  ERROR: ${error.message}`);
                // IMPORTANTE: Resetear estado en caso de excepción
                this.currentProcess = null;
                this.isExecuting = false;
                if (this.onOutputCallback) {
                    this.onOutputCallback(`\r\n❌ Error: ${error.message}\r\n$ `);
                }
                resolve();
            }
        });
    }
    parseCommand(command) {
        const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
        const matches = [];
        let match;
        while ((match = regex.exec(command)) !== null) {
            matches.push(match[1] || match[2] || match[0]);
        }
        return matches.length > 0 ? matches : [command];
    }
    killCurrentProcess() {
        if (this.currentProcess) {
            this.currentProcess.kill('SIGTERM');
            this.currentProcess = null;
            this.isExecuting = false;
            this.outputChannel.appendLine('Process killed by user');
            if (this.onOutputCallback) {
                this.onOutputCallback('\r\n🛑 Proceso cancelado por el usuario\r\n$ ');
            }
        }
        else {
            // Si no hay proceso pero isExecuting está true, resetearlo
            this.isExecuting = false;
            if (this.onOutputCallback) {
                this.onOutputCallback('\r\n🛑 No hay proceso en ejecución\r\n$ ');
            }
        }
    }
    getIsExecuting() {
        return this.isExecuting;
    }
    dispose() {
        this.killCurrentProcess();
        this.outputChannel.dispose();
    }
}
exports.VSCodeTerminalRepository = VSCodeTerminalRepository;
//# sourceMappingURL=VSCodeTerminalRepository.js.map