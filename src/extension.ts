import * as vscode from 'vscode';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';
import { TimelineView } from './presentation/timeline/TimelineView';
import { TestMenuProvider } from './presentation/menu/TestMenuProvider';
import { VSCodeTerminalRepository } from './infrastructure/terminal/VSCodeTerminalRepository';
import { ExecuteCloneCommand } from './application/clone/ExecuteCloneCommand';

let terminalProvider: TerminalViewProvider | null = null;
let timelineView: TimelineView | null = null;
let testMenuProvider: TestMenuProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
  console.log('TDDLab extension is activating...');

  try {
    // Crear TimelineView primero
    timelineView = new TimelineView(context);
    
    // Crear VSCodeTerminalRepository
    const terminalPort = new VSCodeTerminalRepository();
    
    // Crear TerminalViewProvider con TimelineView
    terminalProvider = new TerminalViewProvider(context, timelineView, terminalPort);
    
    // Crear el menú de opciones TDD
    testMenuProvider = new TestMenuProvider();
    
    // Crear instancias para ejecutar tests y clonar proyecto
    const runTests = new NpmRunTests(terminalProvider);
    const executeTestCommand = new ExecuteTestCommand(runTests);
    const executeCloneCommand = new ExecuteCloneCommand();

    // Comando Run Test
    const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
      try {
        if (!terminalProvider) {
          vscode.window.showErrorMessage('Terminal no disponible');
          return;
        }

        await vscode.commands.executeCommand('tddTerminalView.focus');
        terminalProvider.executeCommand('npm run test');
        
      } catch (error: any) {
        const msg = `❌ Error ejecutando tests: ${error.message}`;
        vscode.window.showErrorMessage(msg);
      }
    });

    // Comando Clear Terminal
    const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
      if (terminalProvider) {
        terminalProvider.clearTerminal();
      }
    });

    // Comando Crear Proyecto
    const cloneProjectCmd = vscode.commands.registerCommand('TDD.cloneCommand', async () => {
      try {
        await executeCloneCommand.execute();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error al crear el proyecto: ${error.message}`);
      }
    });

    // Comando Show Timeline (abre la Terminal TDD que contiene el timeline)
    const showTimelineCmd = vscode.commands.registerCommand('extension.showTimeline', async () => {
      try {
        await vscode.commands.executeCommand('tddTerminalView.focus');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Error al mostrar timeline: ${error.message}`);
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

    // Registrar todos los comandos
    context.subscriptions.push(
      runTestCmd, 
      clearTerminalCmd,
      cloneProjectCmd,
      showTimelineCmd,
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

    // Registrar Terminal TDDLab (incluye el Timeline integrado)
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        TerminalViewProvider.viewType,
        terminalProvider
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