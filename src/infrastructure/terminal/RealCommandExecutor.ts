import * as vscode from 'vscode';
import { TerminalPort } from '../../domain/model/TerminalPort';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RealCommandExecutor implements TerminalPort {
  private currentDirectory: string;

  constructor() {
    this.currentDirectory = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  }

  async executeCommand(command: string): Promise<{ output: string; error: string }> {
    try {
      console.log(`[RealCommandExecutor] Executing: ${command} in ${this.currentDirectory}`);
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: this.currentDirectory,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      return { output: stdout, error: stderr };
    } catch (error: any) {
      return { 
        output: '', 
        error: error.stderr || error.message || `Error ejecutando comando: ${command}` 
      };
    }
  }

  getCurrentDirectory(): string {
    return this.currentDirectory;
  }

  async changeDirectory(path: string): Promise<boolean> {
    try {
      // Resolver la ruta (si es relativa, hacerla absoluta)
      const newPath = path.startsWith('/') || /^[a-zA-Z]:/.exec(path) 
        ? path 
        : `${this.currentDirectory}/${path}`;

      // Verificar si el directorio existe
      const { stdout } = await execAsync(`cd "${newPath}" && pwd`);
      this.currentDirectory = stdout.trim();
      return true;
    } catch (error) {
      console.error(`[RealCommandExecutor] Error changing directory to ${path}:`, error);
      return false;
    }
  }

  async executeCommandWithStream(
    command: string, 
    onOutput: (data: string) => void, 
    onError: (data: string) => void
  ): Promise<number> {
    return new Promise((resolve) => {
      try {
        console.log(`[RealCommandExecutor] Streaming: ${command} in ${this.currentDirectory}`);
        
        const [cmd, ...args] = this.parseCommand(command);
        const process = spawn(cmd, args, {
          cwd: this.currentDirectory,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        process.stdout?.on('data', (data: Buffer) => {
          onOutput(data.toString());
        });

        process.stderr?.on('data', (data: Buffer) => {
          onError(data.toString());
        });

        process.on('close', (code) => {
          resolve(code || 0);
        });

        process.on('error', (error) => {
          onError(`Error: ${error.message}`);
          resolve(1);
        });

      } catch (error: any) {
        onError(`Error ejecutando comando: ${error.message}`);
        resolve(1);
      }
    });
  }

  private parseCommand(command: string): string[] {
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