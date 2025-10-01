import * as vscode from 'vscode';
import { ExecuteTestCommand } from './application/runTest/ExecuteTestCommand';
import { NpmRunTests } from './infrastructure/test/NpmRunTests';
import { TerminalViewProvider } from './presentation/terminal/TerminalViewProvider';
import { TimelineView } from './presentation/timeline/TimelineView';
import { RealCommandExecutor } from './infrastructure/terminal/RealCommandExecutor';

let terminalProvider: TerminalViewProvider | null = null;
let timelineView: TimelineView | null = null;

export async function activate(context: vscode.ExtensionContext) {
    console.log('TDDLab extension is activating...');

    try {
        // 🔹 Crear TimelineView primero
        timelineView = new TimelineView(context);
        
        // 🔹 Crear el ejecutor de comandos REALES (ÚNICA IMPLEMENTACIÓN)
        const terminalPort = new RealCommandExecutor();
        
        // 🔹 Crear TerminalViewProvider
        terminalProvider = new TerminalViewProvider(context, timelineView, terminalPort);
        
        // 🔹 Crear instancias para ejecutar tests
        const runTests = new NpmRunTests(terminalProvider);
        const _executeTestCommand = new ExecuteTestCommand(runTests);

        // 🔹 Comandos
        const runTestCmd = vscode.commands.registerCommand('TDD.runTest', async () => {
            if (terminalProvider) {
                await vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.sendToTerminal('npm run test\r\n');
            }
        });

        const openTerminalCmd = vscode.commands.registerCommand('TDD.openTerminal', () => {
            vscode.commands.executeCommand('tddTerminalView.focus');
        });

        const runCypressCmd = vscode.commands.registerCommand('TDD.runCypress', () => {
            if (terminalProvider) {
                vscode.commands.executeCommand('tddTerminalView.focus');
                terminalProvider.sendToTerminal('npx cypress run\r\n');
            }
        });

        context.subscriptions.push(runTestCmd, openTerminalCmd, runCypressCmd);

        // 🔹 Registrar vistas
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
    if (terminalProvider) {
        terminalProvider.dispose();
    }
    terminalProvider = null;
    timelineView = null;
}