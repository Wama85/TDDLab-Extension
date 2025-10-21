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
exports.ExecuteCloneCommand = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ExecuteCloneCommand {
    // URL del repositorio base TDDLab
    REPO_URL = 'https://github.com/UCB-TallerDeDesarrollo/TDDLabBaseProject.git';
    async execute() {
        try {
            // Verificar si Git está instalado
            try {
                await execAsync('git --version');
            }
            catch (error) {
                vscode.window.showErrorMessage('❌ Git no está instalado. Por favor, instala Git primero: https://git-scm.com/');
                return;
            }
            // Abrir diálogo para seleccionar carpeta donde crear el proyecto
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Seleccionar carpeta para crear el proyecto',
                title: 'Crear Proyecto TDDLab'
            });
            if (!folderUri || folderUri.length === 0) {
                vscode.window.showWarningMessage('No se seleccionó ninguna carpeta.');
                return;
            }
            const selectedPath = folderUri[0].fsPath;
            // Verificar si la carpeta está vacía
            const files = await fs.readdir(selectedPath);
            if (files.length > 0) {
                const overwrite = await vscode.window.showWarningMessage('La carpeta seleccionada no está vacía. Los archivos del proyecto base se agregarán aquí. ¿Deseas continuar?', 'Sí', 'No');
                if (overwrite !== 'Sí') {
                    return;
                }
            }
            // Clonar el repositorio con barra de progreso
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creando proyecto TDDLab...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Clonando repositorio..." });
                try {
                    // Crear carpeta temporal para el clone
                    const tempFolder = path.join(selectedPath, '.temp-tddlab-clone');
                    // Clonar en carpeta temporal
                    await execAsync(`git clone ${this.REPO_URL} "${tempFolder}"`);
                    progress.report({ increment: 40, message: "Copiando archivos..." });
                    // Mover todos los archivos de la carpeta temporal a la carpeta seleccionada
                    const clonedFiles = await fs.readdir(tempFolder);
                    for (const file of clonedFiles) {
                        if (file !== '.git') {
                            const srcPath = path.join(tempFolder, file);
                            const destPath = path.join(selectedPath, file);
                            await fs.cp(srcPath, destPath, { recursive: true });
                        }
                    }
                    progress.report({ increment: 80, message: "Limpiando archivos temporales..." });
                    // Eliminar carpeta temporal
                    await fs.rm(tempFolder, { recursive: true, force: true });
                    progress.report({ increment: 100, message: "¡Completado!" });
                }
                catch (error) {
                    throw new Error(`Error al clonar: ${error.message}`);
                }
            });
            // Abrir el proyecto en una nueva ventana de VS Code inmediatamente
            const selectedPathUri = vscode.Uri.file(selectedPath);
            await vscode.commands.executeCommand('vscode.openFolder', selectedPathUri, true);
        }
        catch (error) {
            vscode.window.showErrorMessage(`❌ Error al crear el proyecto: ${error.message}`);
            console.error('Error completo:', error);
        }
    }
}
exports.ExecuteCloneCommand = ExecuteCloneCommand;
//# sourceMappingURL=ExecuteCloneCommand.js.map