import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TerminalViewProvider } from '../../presentation/terminal/TerminalViewProvider';
import { TestRunnerPort } from '../../domain/model/TestRunnerPort';

const execPromise = promisify(exec);

export class NpmRunTests implements TestRunnerPort {
  private terminalProvider: TerminalViewProvider;

  constructor(terminalProvider: TerminalViewProvider) {
    this.terminalProvider = terminalProvider;
  }

  async runTests(): Promise<string[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('No workspace folder found');
    }

    const cwd = workspaceFolder.uri.fsPath;

    try {
      // Ejecutar el comando npm test
      const { stdout, stderr } = await execPromise('npm run test', {
        cwd,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      // Enviar toda la salida a la terminal
      if (stdout) {
        // Dividir por líneas y enviar cada línea
        const lines = stdout.split('\n');
        lines.forEach(line => {
          this.terminalProvider.sendToTerminal(line);
        });
      }

      if (stderr) {
        this.terminalProvider.sendToTerminal('⚠️ Warnings:');
        this.terminalProvider.sendToTerminal(stderr);
      }

      // Parsear resultados para retornar
      const testResults = this.parseTestResults(stdout);
      return testResults;

    } catch (error: any) {
      // Si hay error, también mostramos la salida
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

  // Mantener el método execute() por compatibilidad si se usa en otros lugares
  async execute(): Promise<string[]> {
    return this.runTests();
  }

  private parseTestResults(output: string): string[] {
    const results: string[] = [];
    
    // Buscar líneas con "PASS" o "FAIL"
    const lines = output.split('\n');
    lines.forEach(line => {
      if (line.includes('PASS') || line.includes('FAIL')) {
        results.push(line.trim());
      }
    });

    // Si no encontramos resultados específicos, retornar un resumen
    if (results.length === 0) {
      const summaryMatch = output.match(/Tests:\s+(\d+\s+\w+)/);
      if (summaryMatch) {
        results.push(summaryMatch[0]);
      }
    }

    return results.length > 0 ? results : ['Tests ejecutados'];
  }
}