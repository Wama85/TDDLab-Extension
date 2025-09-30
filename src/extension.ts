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
  
  const runTests = new NpmRunTests(terminalProvider);
  const executeTestCommand = new ExecuteTestCommand(runTests);

  // 🔹 Botón/Comando Run Test
  const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
    try {
      // 🔹 Primero abrimos/mostramos la terminal TDD
      await vscode.commands.executeCommand('tddTerminalView.focus');
      
      // 🔹 Luego ejecutamos los tests
      const results = await executeTestCommand.execute();
      terminalProvider?.sendToTerminal(`✅ Tests ejecutados: ${results.join(', ')}`);
    } catch (error: any) {
      const msg = `❌ Error ejecutando tests: ${error.message}`;
      terminalProvider?.sendToTerminal(msg);
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