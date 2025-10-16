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
        
        // Usar el terminal port para ejecutar en terminal real
        terminalPort.createAndExecuteCommand('TDDLab Tests', 'npm run test');
        
        // Feedback en terminal web
        terminalProvider.sendToTerminal('\r\n🧪 Ejecutando tests...\r\n');
        terminalProvider.sendToTerminal('📋 Los resultados aparecerán en la terminal de tests\r\n\r\n');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando tests: ${error.message}`;
        if (terminalProvider) {
          terminalProvider.sendToTerminal(msg);
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
    const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
        terminalProvider.executeCommand('npx cypress run');
      }
    });

    // Comando Git Status
    const gitStatusCmd = vscode.commands.registerCommand('TDD.gitStatus', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
        terminalProvider.executeCommand('git status');
      }
    });

    // Comando NPM Install
    const npmInstallCmd = vscode.commands.registerCommand('TDD.npmInstall', () => {
      if (terminalProvider) {
        vscode.commands.executeCommand('tddTerminalView.focus');
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