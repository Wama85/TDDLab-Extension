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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteExportCommand = void 0;
const vscode = __importStar(require("vscode"));
const dotenv = __importStar(require("dotenv"));
const fs = __importStar(require("fs"));
const CryptoJS = __importStar(require("crypto-js"));
const path = __importStar(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
class ExecuteExportCommand {
    key = '';
    constructor() {
        dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });
        this.key = process.env.CLAVE_ENCRIPTACION || '';
    }
    async selectFolder() {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Seleccionar carpeta'
        });
        if (!folderUri || folderUri.length === 0) {
            vscode.window.showErrorMessage('No se seleccionó ninguna carpeta.');
            return undefined;
        }
        return folderUri[0].fsPath;
    }
    async getFileName() {
        const fileName = await vscode.window.showInputBox({
            prompt: 'Ingresa el nombre del archivo (sin extensión)',
            validateInput: (input) => {
                if (!input || input.trim() === '') {
                    return 'El nombre del archivo no puede estar vacío.';
                }
                if (/[^a-zA-Z0-9_\-]/.test(input)) {
                    return 'El nombre del archivo solo puede contener letras, números, guiones y guiones bajos.';
                }
                return null;
            }
        });
        if (!fileName) {
            vscode.window.showErrorMessage('No se ingresó un nombre para el archivo.');
            return undefined;
        }
        return `${fileName}.zip`;
    }
    compressFile(sourceFile, destinationFile) {
        try {
            const zip = new adm_zip_1.default();
            zip.addLocalFile(sourceFile);
            zip.writeZip(destinationFile);
        }
        catch (error) {
            console.error('Error en la compresion:', error);
        }
    }
    encryptFile(sourceFile, destinationFile) {
        try {
            const binaryData = fs.readFileSync(sourceFile);
            const base64Data = binaryData.toString('base64');
            const encryptedContent = CryptoJS.AES.encrypt(base64Data, this.key).toString();
            fs.writeFileSync(destinationFile, encryptedContent, 'utf8');
        }
        catch (error) {
            console.error('Error en la encriptación:', error);
        }
    }
    async execute() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        const tddLogPath = `${workspaceFolder}/script/tdd_log.json`;
        if (!fs.existsSync(tddLogPath)) {
            vscode.window.showErrorMessage('No existe un registro de pruebas.');
            return;
        }
        const folderPath = await this.selectFolder();
        if (!folderPath) {
            return;
        }
        const fileName = await this.getFileName();
        if (!fileName) {
            return;
        }
        const destinationPath = path.join(folderPath, fileName);
        if (fs.existsSync(destinationPath)) {
            vscode.window.showWarningMessage(`El archivo '${fileName}' ya existe en la carpeta seleccionada.`);
            return;
        }
        this.compressFile(tddLogPath, destinationPath);
        this.encryptFile(destinationPath, destinationPath);
        vscode.window.showInformationMessage(`TDD Data exportado correctamente en: ${destinationPath}`);
    }
}
exports.ExecuteExportCommand = ExecuteExportCommand;
//# sourceMappingURL=ExecuteExportCommand.js.map