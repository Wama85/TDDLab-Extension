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
    // Crear TimelineView primero
    timelineView = new TimelineView(context);
    
    // Crear el repositorio de terminal
    const terminalPort = new VSCodeTerminalRepository();
    
    // Crear TerminalViewProvider con TimelineView y terminalPort
    terminalProvider = new TerminalViewProvider(context, timelineView, terminalPort);
    
    // Crear el menú de opciones TDD
    testMenuProvider = new TestMenuProvider();
    
    // Crear instancias para ejecutar tests
    const runTests = new NpmRunTests(terminalProvider);
    const executeTestCommand = new ExecuteTestCommand(runTests);

    // Botón/Comando Run Test
    const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        
        // Ejecutar comando de test a través del terminal provider
        await terminalProvider.executeRealCommand('npm test');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando tests: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        } else {
          vscode.window.showErrorMessage(msg);
        }
      }
    });

    // Comando Clear Terminal
    const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
      if (terminalProvider) {
        terminalProvider.clearTerminal();
      }
    });

    // Comando Run Cypress
    const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        await terminalProvider.executeRealCommand('npx cypress run');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando Cypress: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        }
      }
    });

    // Comando Git Status
    const gitStatusCmd = vscode.commands.registerCommand('TDD.gitStatus', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        await terminalProvider.executeRealCommand('git status');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando git status: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        }
      }
    });

    // Comando NPM Install
    const npmInstallCmd = vscode.commands.registerCommand('TDD.npmInstall', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        await terminalProvider.executeRealCommand('npm install');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando npm install: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        }
      }
    });

    // Comando Build
    const buildCmd = vscode.commands.registerCommand('TDD.build', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        await terminalProvider.executeRealCommand('npm run build');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando build: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(`\x1b[31m${msg}\x1b[0m\r\n`);
        }
      }
    });

    context.subscriptions.push(
      runTestCmd, 
      clearTerminalCmd, 
      runCypressCmd, 
      gitStatusCmd, 
      npmInstallCmd,
      buildCmd
    );

    // Registrar el menú de opciones TDD
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider(
        'tddTestExecution',
        testMenuProvider
      )
    );

    // Registrar Terminal TDDLab
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        TerminalViewProvider.viewType,
        terminalProvider
      )
    );

    // Registrar TimelineView
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