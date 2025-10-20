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
    outputChannel;
    currentProcess = null;
    onOutputCallback = null;
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('TDDLab Commands');
    }
    setOnOutputCallback(callback) {
        this.onOutputCallback = callback;
    }
    async createAndExecuteCommand(terminalName, command) {
        return new Promise((resolve) => {
            try {
                this.outputChannel.appendLine(`[${new Date().toISOString()}] Executing: ${command}`);
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
                this.outputChannel.appendLine(`  Directory: ${cwd}`);
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
                        this.onOutputCallback(`\x1b[31m${error}\x1b[0m`);
                    }
                });
                this.currentProcess.on('close', (code) => {
                    this.outputChannel.appendLine(`\nCommand exited with code: ${code}`);
                    if (code === 0) {
                        if (this.onOutputCallback) {
                            this.onOutputCallback(`\x1b[32m✅ Comando ejecutado correctamente (código: ${code})\x1b[0m\r\n`);
                        }
                    }
                    else {
                        if (this.onOutputCallback) {
                            this.onOutputCallback(`\x1b[31m❌ Comando falló con código: ${code}\x1b[0m\r\n`);
                        }
                    }
                    this.currentProcess = null;
                    resolve();
                });
                this.currentProcess.on('error', (error) => {
                    this.outputChannel.appendLine(`Process error: ${error.message}`);
                    if (this.onOutputCallback) {
                        this.onOutputCallback(`\x1b[31m❌ Error ejecutando comando: ${error.message}\x1b[0m\r\n`);
                    }
                    this.currentProcess = null;
                    resolve();
                });
            }
            catch (error) {
                this.outputChannel.appendLine(`  ERROR: ${error.message}`);
                if (this.onOutputCallback) {
                    this.onOutputCallback(`\x1b[31m❌ Error: ${error.message}\x1b[0m\r\n`);
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
            this.currentProcess.kill();
            this.currentProcess = null;
            this.outputChannel.appendLine('Process killed by user');
            if (this.onOutputCallback) {
                this.onOutputCallback('\x1b[33m🛑 Proceso cancelado por el usuario\x1b[0m\r\n');
            }
        }
    }
    dispose() {
        this.killCurrentProcess();
        this.outputChannel.dispose();
    }
}
exports.VSCodeTerminalRepository = VSCodeTerminalRepository;
//# sourceMappingURL=VSCodeTerminalRepository.js.map