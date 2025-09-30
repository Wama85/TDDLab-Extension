
import * as vscode from 'vscode';
import { VSCodeTerminalRepository } from './infrastructure/terminal/VSCodeTerminalRepository';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';

export async function activate(context: vscode.ExtensionContext) {
  const terminalRepo = new VSCodeTerminalRepository();
  const runTests = new NpmRunTests(terminalRepo);
  const executeTestCommand = new ExecuteTestCommand(runTests);

  const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
    const results = await executeTestCommand.execute();
    vscode.window.showInformationMessage(`Tests ejecutados: ${results.length}`);
  });

 context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    TerminalViewProvider.viewType,
    new TerminalViewProvider(context)
  )
);
}
