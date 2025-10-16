import * as vscode from 'vscode';
import { TerminalPort } from '../../domain/model/TerminalPort';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VSCodeTerminalRepository implements TerminalPort {
  private readonly outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('TDDLab Commands');
  }

  private getTerminalByName(name: string): vscode.Terminal | undefined {
    return vscode.window.terminals.find(terminal => terminal.name === name);
  }

  async createAndExecuteCommand(terminalName: string, command: string): Promise<{output: string, error: string}> {
    try {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] Executing: ${command}`);
      
      // Obtener el workspace actual
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();

      this.outputChannel.appendLine(`  Directory: ${cwd}`);

      // Ejecutar el comando y capturar output
      const { stdout, stderr } = await execAsync(command, { 
        cwd: cwd,
        encoding: 'utf8' as BufferEncoding,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      // Log del resultado
      if (stdout) {
        this.outputChannel.appendLine(`  Output: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      }
      if (stderr) {
        this.outputChannel.appendLine(`  Error: ${stderr.substring(0, 200)}${stderr.length > 200 ? '...' : ''}`);
      }

      // También crear terminal de VS Code para comandos largos o interactivos
      if (this.shouldShowInVSCodeTerminal(command)) {
        this.createVSCodeTerminal(terminalName, command, cwd);
      }

      return { output: stdout, error: stderr };
      
    } catch (error: any) {
      this.outputChannel.appendLine(`  ERROR: ${error.message}`);
      
      // Mostrar error en terminal de VS Code también
      this.createVSCodeTerminal(terminalName, `echo "Error: ${error.message}"`, process.cwd());
      
      return { 
        output: '', 
        error: error.stderr || error.message || `Error ejecutando comando: ${command}` 
      };
    }
  }

  private shouldShowInVSCodeTerminal(command: string): boolean {
    // Comandos que deben mostrarse en terminal VS Code
    const interactiveCommands = [
      'npm start', 'npm run dev', 'npm run serve', 
      'node ', 'python ', 'python3 ', 'ruby ', 'php ',
      'docker-compose', 'kubectl ', 'ssh ', 'ng serve'
    ];
    
    return interactiveCommands.some(cmd => command.includes(cmd));
  }

  private createVSCodeTerminal(terminalName: string, command: string, cwd: string): void {
    let terminal = this.getTerminalByName(terminalName);

    if (!terminal) {
      terminal = vscode.window.createTerminal({
        name: terminalName,
        cwd: cwd
      });
    }

    terminal.show();
    
    // Limpiar terminal si es nueva
    if (!this.getTerminalByName(terminalName)) {
      terminal.sendText('clear');
    }
    
    terminal.sendText(command);
    this.outputChannel.appendLine(`  Command sent to VS Code terminal: ${terminalName}`);
  }

  // Nuevo método para comandos específicos de TDD
  public executeTestCommand(testCommand: string): Promise<{output: string, error: string}> {
    this.outputChannel.show();
    return this.createAndExecuteCommand('TDDLab Tests', testCommand);
  }

  public executeBuildCommand(buildCommand: string): Promise<{output: string, error: string}> {
    return this.createAndExecuteCommand('TDDLab Build', buildCommand);
  }

  public showOutputChannel(): void {
    this.outputChannel.show();
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }
}