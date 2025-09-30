import { TestRunnerPort } from '../../domain/model/TestRunnerPort';
import { TerminalViewProvider } from '../../presentation/terminal/TerminalViewProvider';

export class NpmRunTests implements TestRunnerPort {
  constructor(private readonly terminalProvider: TerminalViewProvider) {}

  async runTests(): Promise<string[]> {
    this.terminalProvider.sendToTerminal('🚀 Ejecutando: npm run test');
    return ['npm run test ejecutado en TDDLab'];
  }
}
