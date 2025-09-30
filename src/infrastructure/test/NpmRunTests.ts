import { RunTests } from '../../domain/test/RunTests';
import { TestResult } from '../../domain/test/TestResult';
import { TerminalRepository } from '../../domain/terminal/TerminalRepository';

export class NpmRunTests implements RunTests {
  constructor(private readonly terminal: TerminalRepository) {}

  async execute(): Promise<TestResult[]> {
    const output = await this.terminal.runCommand("npm test");
    // TODO: parsear resultados reales desde el output
    return [{ name: "dummy test", success: true, duration: 50 }];
  }
}