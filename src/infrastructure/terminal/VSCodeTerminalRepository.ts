import * as vscode from 'vscode';
import { TerminalPort } from '../../domain/model/TerminalPort';
import { spawn } from 'child_process';

export class VSCodeTerminalRepository implements TerminalPort {
  private outputChannel: vscode.OutputChannel;
  private currentProcess: any = null;
  private onOutputCallback: ((output: string) => void) | null = null;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TDDLab Commands');
  }

  setOnOutputCallback(callback: (output: string) => void): void {
    this.onOutputCallback = callback;
  }

  async createAndExecuteCommand(terminalName: string, command: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] Executing: ${command}`);
        
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

        this.outputChannel.appendLine(`  Directory: ${cwd}`);

        const [cmd, ...args] = this.parseCommand(command);
        
        this.currentProcess = spawn(cmd, args, {
          cwd: cwd,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.currentProcess.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();
          this.outputChannel.append(output);
          if (this.onOutputCallback) {
            this.onOutputCallback(output);
          }
        });

        this.currentProcess.stderr?.on('data', (data: Buffer) => {
          const error = data.toString();
          this.outputChannel.append(error);
          if (this.onOutputCallback) {
            this.onOutputCallback(`\x1b[31m${error}\x1b[0m`);
          }
        });

        this.currentProcess.on('close', (code: number) => {
          this.outputChannel.appendLine(`\nCommand exited with code: ${code}`);
          
          if (code === 0) {
            if (this.onOutputCallback) {
              this.onOutputCallback(`\x1b[32m✅ Comando ejecutado correctamente (código: ${code})\x1b[0m\r\n`);
            }
          } else {
            if (this.onOutputCallback) {
              this.onOutputCallback(`\x1b[31m❌ Comando falló con código: ${code}\x1b[0m\r\n`);
            }
          }
          
          this.currentProcess = null;
          resolve();
        });

        this.currentProcess.on('error', (error: Error) => {
          this.outputChannel.appendLine(`Process error: ${error.message}`);
          if (this.onOutputCallback) {
            this.onOutputCallback(`\x1b[31m❌ Error ejecutando comando: ${error.message}\x1b[0m\r\n`);
          }
          this.currentProcess = null;
          resolve();
        });

      } catch (error: any) {
        this.outputChannel.appendLine(`  ERROR: ${error.message}`);
        if (this.onOutputCallback) {
          this.onOutputCallback(`\x1b[31m❌ Error: ${error.message}\x1b[0m\r\n`);
        }
        resolve();
      }
    });
  }

  private parseCommand(command: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(command)) !== null) {
      matches.push(match[1] || match[2] || match[0]);
    }
    
    return matches.length > 0 ? matches : [command];
  }

  public killCurrentProcess(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.outputChannel.appendLine('Process killed by user');
      if (this.onOutputCallback) {
        this.onOutputCallback('\x1b[33m🛑 Proceso cancelado por el usuario\x1b[0m\r\n');
      }
    }
  }

  public dispose(): void {
    this.killCurrentProcess();
    this.outputChannel.dispose();
  }
}