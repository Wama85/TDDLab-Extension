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
exports.RealCommandExecutor = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class RealCommandExecutor {
    currentDirectory;
    constructor() {
        this.currentDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
    }
    async executeCommand(command) {
        try {
            console.log(`[RealCommandExecutor] Executing: ${command} in ${this.currentDirectory}`);
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.currentDirectory,
                encoding: 'utf8',
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
            });
            return { output: stdout, error: stderr };
        }
        catch (error) {
            return {
                output: '',
                error: error.stderr || error.message || `Error ejecutando comando: ${command}`
            };
        }
    }
    getCurrentDirectory() {
        return this.currentDirectory;
    }
    async changeDirectory(path) {
        try {
            // Resolver la ruta (si es relativa, hacerla absoluta)
            const newPath = path.startsWith('/') || /^[a-zA-Z]:/.exec(path)
                ? path
                : `${this.currentDirectory}/${path}`;
            // Verificar si el directorio existe
            const { stdout } = await execAsync(`cd "${newPath}" && pwd`);
            this.currentDirectory = stdout.trim();
            return true;
        }
        catch (error) {
            console.error(`[RealCommandExecutor] Error changing directory to ${path}:`, error);
            return false;
        }
    }
    async executeCommandWithStream(command, onOutput, onError) {
        return new Promise((resolve) => {
            try {
                console.log(`[RealCommandExecutor] Streaming: ${command} in ${this.currentDirectory}`);
                const [cmd, ...args] = this.parseCommand(command);
                const process = (0, child_process_1.spawn)(cmd, args, {
                    cwd: this.currentDirectory,
                    shell: true,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                process.stdout?.on('data', (data) => {
                    onOutput(data.toString());
                });
                process.stderr?.on('data', (data) => {
                    onError(data.toString());
                });
                process.on('close', (code) => {
                    resolve(code || 0);
                });
                process.on('error', (error) => {
                    onError(`Error: ${error.message}`);
                    resolve(1);
                });
            }
            catch (error) {
                onError(`Error ejecutando comando: ${error.message}`);
                resolve(1);
            }
        });
    }
    parseCommand(command) {
        // Manejar comandos complejos con comillas
        const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
        const matches = [];
        let match;
        while ((match = regex.exec(command)) !== null) {
            matches.push(match[1] || match[2] || match[0]);
        }
        return matches;
    }
}
exports.RealCommandExecutor = RealCommandExecutor;
//# sourceMappingURL=RealCommandExecutor.js.map