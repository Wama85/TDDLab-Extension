import * as vscode from 'vscode';

import { TerminalRepository } from '../../domain/terminal/TerminalRepository';

export class VSCodeTerminalRepository implements TerminalRepository {
  async runCommand(command: string): Promise<string> {
    const terminal = vscode.window.createTerminal("TDDLab");
    terminal.show();
    terminal.sendText(command);
    return new Promise(resolve => {
      // Por ahora solo simula que se ejecuta el comando
      resolve(`Executed: ${command}`);
    });
  }
}