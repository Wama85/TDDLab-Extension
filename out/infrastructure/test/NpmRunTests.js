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
exports.NpmRunTests = void 0;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
class NpmRunTests {
    constructor(terminalProvider) {
        this.terminalProvider = terminalProvider;
    }
    async runTests() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        const cwd = workspaceFolder.uri.fsPath;
        try {
            const { stdout, stderr } = await execPromise('npm run test', {
                cwd,
                maxBuffer: 1024 * 1024 * 10,
            });
            if (stdout) {
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    this.terminalProvider.sendToTerminal(line);
                });
            }
            if (stderr) {
                this.terminalProvider.sendToTerminal('⚠️ Warnings:');
                this.terminalProvider.sendToTerminal(stderr);
            }
            const testResults = this.parseTestResults(stdout);
            return testResults;
        }
        catch (error) {
            if (error.stdout) {
                this.terminalProvider.sendToTerminal(error.stdout);
            }
            if (error.stderr) {
                this.terminalProvider.sendToTerminal('❌ Error:');
                this.terminalProvider.sendToTerminal(error.stderr);
            }
            throw error;
        }
    }
    async execute() {
        return this.runTests();
    }
    parseTestResults(output) {
        const results = [];
        const lines = output.split('\n');
        lines.forEach(line => {
            if (line.includes('PASS') || line.includes('FAIL')) {
                results.push(line.trim());
            }
        });
        if (results.length === 0) {
            const summaryMatch = output.match(/Tests:\s+(\d+\s+\w+)/);
            if (summaryMatch) {
                results.push(summaryMatch[0]);
            }
        }
        return results.length > 0 ? results : ['Tests ejecutados'];
    }
}
exports.NpmRunTests = NpmRunTests;
//# sourceMappingURL=NpmRunTests.js.map