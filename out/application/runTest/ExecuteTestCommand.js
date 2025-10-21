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
exports.ExecuteTestCommand = void 0;
const vscode = __importStar(require("vscode"));
class ExecuteTestCommand {
    constructor(runTests) {
        this.runTests = runTests;
    }
    async execute() {
        try {
            await this.runTests.execute();
        }
        catch (error) {
            if (error.message.includes('Jest no está instalado')) {
                // Ofrecer instalar Jest automáticamente
                const install = await vscode.window.showErrorMessage('Jest no está instalado. ¿Deseas instalarlo ahora?', 'Sí, instalar Jest', 'No');
                if (install === 'Sí, instalar Jest') {
                    await this.installJest();
                    await this.runTests.execute(); // Reintentar
                }
            }
            else {
                throw error;
            }
        }
    }
    async installJest() {
        // Implementar instalación de Jest
        const terminal = vscode.window.createTerminal('Instalar Jest');
        terminal.show();
        terminal.sendText('npm install --save-dev jest');
    }
}
exports.ExecuteTestCommand = ExecuteTestCommand;
//# sourceMappingURL=ExecuteTestCommand.js.map