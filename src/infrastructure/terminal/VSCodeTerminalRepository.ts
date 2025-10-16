import * as vscode from 'vscode';
import { TerminalPort } from '../../domain/model/TerminalPort';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class VSCodeTerminalRepository implements TerminalPort {
  private getTerminalByName(name: string): vscode.Terminal | undefined {
    return vscode.window.terminals.find(terminal => terminal.name === name);
  }

  async createAndExecuteCommand(terminalName: string, command: string): Promise<{output: string, error: string}> {
    try {
      console.log(`[VSCodeTerminalRepository] Executing: ${command}`);
      
      // Obtener el workspace actual
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : process.cwd();
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: cwd,
        encoding: 'utf8' as BufferEncoding,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      let terminal = this.getTerminalByName(terminalName);
      if (!terminal) {
        terminal = vscode.window.createTerminal({
          name: terminalName,
          cwd: cwd
        });
      }
      terminal.show();
      terminal.sendText(command);

      return { output: stdout, error: stderr };
      
    } catch (error: any) {
      console.error(`[VSCodeTerminalRepository] Error executing command: ${error}`);

      const terminal = vscode.window.createTerminal({
        name: terminalName,
      });
      terminal.show();
      terminal.sendText(`echo "Error: ${error.message}"`);
      
      return { 
        output: '', 
        error: error.stderr || error.message || `Error ejecutando comando: ${command}` 
      };
    }
  }
}