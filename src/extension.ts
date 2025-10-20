import * as vscode from 'vscode';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';
import { TimelineView } from './presentation/timeline/TimelineView';
import { TestMenuProvider } from './presentation/menu/TestMenuProvider';
import { ExecuteCloneCommand } from './application/clone/ExecuteCloneCommand';

let terminalProvider: TerminalViewProvider | null = null;
let timelineView: TimelineView | null = null;
let testMenuProvider: TestMenuProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
  //  Crear TimelineView primero
  timelineView = new TimelineView(context);
  
  //  Crear TerminalViewProvider con TimelineView
  terminalProvider = new TerminalViewProvider(context, timelineView);
  
  //  Crear el menú de opciones TDD
  testMenuProvider = new TestMenuProvider();
  
  //  Crear instancias para ejecutar tests y clonar proyecto
  const runTests = new NpmRunTests(terminalProvider);
  const executeTestCommand = new ExecuteTestCommand(runTests);
  const executeCloneCommand = new ExecuteCloneCommand(); // Ya no necesita tddBasePath

  //  Botón/Comando Run Test
  const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
    try {
      if (!terminalProvider) {
        vscode.window.showErrorMessage('Terminal no disponible');
        return;
      }

      //  Primero abrimos/mostramos la terminal TDD
      await vscode.commands.executeCommand('tddTerminalView.focus');
      
      //  Mostrar el comando en la terminal con línea en blanco
      terminalProvider.sendToTerminal('$ npm run test');
      terminalProvider.sendToTerminal('');
      
      //  Ejecutar los tests (esto enviará la salida a la terminal)
      await executeTestCommand.execute();
      
    } catch (error: any) {
      const msg = `❌ Error ejecutando tests: ${error.message}`;
      if (terminalProvider) {
        terminalProvider.sendToTerminal(msg);
      } else {
        vscode.window.showErrorMessage(msg);
      }
    }
  });

  //  Comando Clear Terminal
  const clearTerminalCmd = vscode.commands.registerCommand('TDD.clearTerminal', () => {
    if (terminalProvider) {
      terminalProvider.clearTerminal();
    }
  });

  //  Comando Crear Proyecto (ahora clona desde Git)
  const cloneProjectCmd = vscode.commands.registerCommand('TDD.cloneCommand', async () => {
    try {
      await executeCloneCommand.execute(); // Ya no necesita parámetros
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error al crear el proyecto: ${error.message}`);
    }
  });

  //  Comando Show Timeline (abre la Terminal TDD que contiene el timeline)
  const showTimelineCmd = vscode.commands.registerCommand('extension.showTimeline', async () => {
    try {
      // Abrir la vista de la Terminal TDD donde está el Timeline
      await vscode.commands.executeCommand('tddTerminalView.focus');
    } catch (error: any) {
      vscode.window.showErrorMessage(`Error al mostrar timeline: ${error.message}`);
    }
  });

  context.subscriptions.push(runTestCmd, clearTerminalCmd, cloneProjectCmd, showTimelineCmd);

  //  Registrar el menú de opciones TDD
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'tddTestExecution',
      testMenuProvider
    )
  );

  //  Registrar Terminal TDDLab (incluye el Timeline integrado)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TerminalViewProvider.viewType,
      terminalProvider
    )
  );
}

export function deactivate() {
  terminalProvider = null;
  timelineView = null;
  testMenuProvider = null;
}