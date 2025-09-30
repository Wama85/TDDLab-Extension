import { RunTests } from '../../domain/test/RunTests';
import { TestResult } from '../../domain/test/TestResult';

export class ExecuteTestCommand {
  constructor(private readonly runTests: RunTests) {}

  async execute(): Promise<TestResult[]> {
    return await this.runTests.execute();
  }
}