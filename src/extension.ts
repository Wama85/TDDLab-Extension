import * as vscode from 'vscode';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';
import { TimelineView } from './presentation/timeline/TimelineView';

let terminalProvider: TerminalViewProvider | null = null;
let timelineView: TimelineView | null = null;

export async function activate(context: vscode.ExtensionContext) {
  // 🔹 Crear TimelineView primero
  timelineView = new TimelineView(context);
  
  // 🔹 Crear TerminalViewProvider con TimelineView
  terminalProvider = new TerminalViewProvider(context, timelineView);
  
  // 🔹 Crear instancias para ejecutar tests
  const runTests = new NpmRunTests(terminalProvider);
  const executeTestCommand = new ExecuteTestCommand(runTests);

  // 🔹 Botón/Comando Run Test
  const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
    try {
      if (!terminalProvider) {
        vscode.window.showErrorMessage('Terminal no disponible');
        return;
      }

      // 🔹 Primero abrimos/mostramos la terminal TDD
      await vscode.commands.executeCommand('tddTerminalView.focus');
      
      // 🔹 Mostrar el comando en la terminal con línea en blanco
      terminalProvider.sendToTerminal('$ npm run test');
      terminalProvider.sendToTerminal('');
      
      // 🔹 Ejecutar los tests (esto enviará la salida a la terminal)
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

  context.subscriptions.push(runTestCmd);

  // 🔹 Registrar Terminal TDDLab
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      TerminalViewProvider.viewType,
      terminalProvider
    )
  );

  // 🔹 Registrar TimelineView (si quieres que también esté disponible como vista separada)
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'tddTimelineView',
      timelineView
    )
  );
}

export function deactivate() {
  terminalProvider = null;
  timelineView = null;
}