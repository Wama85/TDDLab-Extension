import * as vscode from 'vscode';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';
import { TimelineView } from './presentation/timeline/TimelineView';
import { TestMenuProvider } from './presentation/menu/TestMenuProvider';
import { VSCodeTerminalRepository } from './infrastructure/terminal/VSCodeTerminalRepository';

let terminalProvider: TerminalViewProvider | null = null;
let timelineView: TimelineView | null = null;
let testMenuProvider: TestMenuProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('TDDLab extension is activating...');

  try {
    timelineView = new TimelineView(context);
    
    const terminalPort = new VSCodeTerminalRepository();
    
    terminalProvider = new TerminalViewProvider(context, timelineView, terminalPort);
    
    testMenuProvider = new TestMenuProvider();
    
    const runTests = new NpmRunTests(terminalProvider);
    const executeTestCommand = new ExecuteTestCommand(runTests);

    const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        
        // CAMBIO: Usar executeCommand en lugar de executeRealCommand
        terminalProvider.executeCommand('npm test');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando tests: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        }
      }
    });

    const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
      if (terminalProvider) {
        terminalProvider.clearTerminal();
      }
    });

    // Comando Run Cypress (si lo tienes)
    const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
        // CAMBIO: Usar executeCommand en lugar de executeRealCommand
        terminalProvider.executeCommand('npx cypress run');
      }
    });

    // Comando Git Status (si lo tienes)
    const gitStatusCmd = vscode.commands.registerCommand('TDD.gitStatus', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
        // CAMBIO: Usar executeCommand en lugar de executeRealCommand
        terminalProvider.executeCommand('git status');
      }
    });

    // Comando NPM Install (si lo tienes)
    const npmInstallCmd = vscode.commands.registerCommand('TDD.npmInstall', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
        // CAMBIO: Usar executeCommand en lugar de executeRealCommand
        terminalProvider.executeCommand('npm install');
      }
    });

    context.subscriptions.push(
      runTestCmd, 
      clearTerminalCmd, 
      runCypressCmd, 
      gitStatusCmd, 
      npmInstallCmd
    );

    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'tddTestExecution',
        testMenuProvider
      )
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        TerminalViewProvider.viewType,
        terminalProvider
      )
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'tddTimelineView',
        timelineView
      )
    );

    console.log('TDDLab extension activated ✅');

  } catch (error) {
    console.error('Error activating TDDLab extension:', error);
    vscode.window.showErrorMessage(`Error activating TDDLab: ${error}`);
  }
}

export function deactivate() {
  terminalProvider = null;
  timelineView = null;
  testMenuProvider = null;
}