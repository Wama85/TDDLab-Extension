import { NpmRunTests } from '../../infrastructure/test/NpmRunTests';
import * as vscode from 'vscode';

export class ExecuteTestCommand {
  constructor(private runTests: NpmRunTests) {}

  async execute(): Promise<void> {
    try {
      await this.runTests.execute();
    } catch (error: any) {
      if (error.message.includes('Jest no está instalado')) {
        // Ofrecer instalar Jest automáticamente
        const install = await vscode.window.showErrorMessage(
          'Jest no está instalado. ¿Deseas instalarlo ahora?',
          'Sí, instalar Jest',
          'No'
        );
        
        if (install === 'Sí, instalar Jest') {
          await this.installJest();
          await this.runTests.execute(); // Reintentar
        }
      } else {
        throw error;
      }
    }
  }

  private async installJest(): Promise<void> {
    // Implementar instalación de Jest
    const terminal = vscode.window.createTerminal('Instalar Jest');
    terminal.show();
    terminal.sendText('npm install --save-dev jest');
  }
}