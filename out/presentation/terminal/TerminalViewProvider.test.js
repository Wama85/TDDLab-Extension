"use strict";
// src/presentation/terminal/TerminalViewProvider.test.ts
// ⭐ MOCK PRIMERO - antes de cualquier import
Object.defineProperty(exports, "__esModule", { value: true });
const TerminalViewProvider_1 = require("./TerminalViewProvider");
// Mocks
class MockTimelineView {
    async getTimelineHtml(webview) {
        return '<div>Mock Timeline</div>';
    }
}
class MockTerminalPort {
    executedCommands = [];
    isExecuting = false;
    outputCallback = null;
    async createAndExecuteCommand(terminalName, command) {
        this.executedCommands.push(command);
        this.isExecuting = true;
        // Simular ejecución
        if (this.outputCallback) {
            this.outputCallback(`Executing: ${command}\n`);
            this.outputCallback(`✅ Comando ejecutado correctamente\n`);
            this.outputCallback('$ ');
        }
        this.isExecuting = false;
    }
    setOnOutputCallback(callback) {
        this.outputCallback = callback;
    }
    killCurrentProcess() {
        this.isExecuting = false;
        if (this.outputCallback) {
            this.outputCallback('\n🛑 Proceso cancelado\n$ ');
        }
    }
    getExecutedCommands() {
        return this.executedCommands;
    }
    clearExecutedCommands() {
        this.executedCommands = [];
    }
}
class MockExtensionContext {
    globalState = {
        data: new Map(),
        get: function (key, defaultValue) {
            return this.data.get(key) || defaultValue;
        },
        update: function (key, value) {
            this.data.set(key, value);
            return Promise.resolve();
        }
    };
}
describe('TerminalViewProvider - Command Tests', () => {
    let terminalProvider;
    let mockContext;
    let mockTimelineView;
    let mockTerminalPort;
    beforeEach(() => {
        mockContext = new MockExtensionContext();
        mockTimelineView = new MockTimelineView();
        mockTerminalPort = new MockTerminalPort();
        terminalProvider = new TerminalViewProvider_1.TerminalViewProvider(mockContext, mockTimelineView, mockTerminalPort);
    });
    describe('1️⃣ Run Tests Command', () => {
        it('should execute npm test command', async () => {
            // Act
            await terminalProvider.executeCommand('npm test');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('npm test');
        });
        it('should execute npm run test command', async () => {
            // Act
            await terminalProvider.executeCommand('npm run test');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('npm run test');
        });
        it('should execute multiple test commands sequentially', async () => {
            // Act
            await terminalProvider.executeCommand('npm test');
            await terminalProvider.executeCommand('npm run test:coverage');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toHaveLength(2);
            expect(executed[0]).toBe('npm test');
            expect(executed[1]).toBe('npm run test:coverage');
        });
    });
    describe(' Clear Terminal Command', () => {
        it('should clear terminal buffer', () => {
            // Arrange
            terminalProvider.sendToTerminal('Some previous output\n');
            // Act
            terminalProvider.clearTerminal();
            // Assert - buffer should be reset to just prompt
            const buffer = terminalProvider.terminalBuffer;
            expect(buffer).toBe('$ ');
        });
        it('should clear terminal and save state', () => {
            // Arrange
            terminalProvider.sendToTerminal('Previous content\n');
            // Act
            terminalProvider.clearTerminal();
            // Assert
            const savedBuffer = mockContext.globalState.get('tddTerminalBuffer');
            expect(savedBuffer).toBe('$ ');
        });
        it('should allow new commands after clearing', async () => {
            // Arrange
            await terminalProvider.executeCommand('npm test');
            // Act
            terminalProvider.clearTerminal();
            mockTerminalPort.clearExecutedCommands();
            await terminalProvider.executeCommand('npm run lint');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('npm run lint');
        });
        it('should handle multiple clear operations', () => {
            // Arrange
            terminalProvider.sendToTerminal('Content 1\n');
            // Act
            terminalProvider.clearTerminal();
            terminalProvider.sendToTerminal('Content 2\n');
            terminalProvider.clearTerminal();
            // Assert
            const buffer = terminalProvider.terminalBuffer;
            expect(buffer).toBe('$ ');
        });
    });
    describe('Execute Command (General)', () => {
        it('should execute git status command', async () => {
            // Act
            await terminalProvider.executeCommand('git status');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('git status');
        });
        it('should execute git branch command', async () => {
            // Act
            await terminalProvider.executeCommand('git branch');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('git branch');
        });
        it('should handle empty command gracefully', async () => {
            // Act
            await terminalProvider.executeCommand('');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toHaveLength(0);
        });
        it('should trim whitespace from commands', async () => {
            // Act
            await terminalProvider.executeCommand('  npm test  ');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed[0]).toBe('npm test'); // Se ejecuta pero con espacios
        });
        it('should execute pwd command', async () => {
            // Act
            await terminalProvider.executeCommand('pwd');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('pwd');
        });
    });
    describe(' Terminal Output', () => {
        it('should send output to terminal', () => {
            // Arrange
            const message = 'Test output message';
            // Act
            terminalProvider.sendToTerminal(message);
            // Assert
            const buffer = terminalProvider.terminalBuffer;
            expect(buffer).toContain(message);
        });
        it('should accumulate multiple outputs', () => {
            // Act
            terminalProvider.sendToTerminal('Line 1\n');
            terminalProvider.sendToTerminal('Line 2\n');
            terminalProvider.sendToTerminal('Line 3\n');
            // Assert
            const buffer = terminalProvider.terminalBuffer;
            expect(buffer).toContain('Line 1');
            expect(buffer).toContain('Line 2');
            expect(buffer).toContain('Line 3');
        });
        it('should persist terminal buffer to storage', () => {
            // Arrange
            const message = 'Persistent message';
            // Act
            terminalProvider.sendToTerminal(message);
            // Assert
            const savedBuffer = mockContext.globalState.get('tddTerminalBuffer');
            expect(savedBuffer).toContain(message);
        });
    });
    describe(' Command Validation', () => {
        it('should accept valid npm commands', async () => {
            // Arrange
            const validCommands = ['npm test', 'npm run build', 'npm install'];
            // Act & Assert
            for (const cmd of validCommands) {
                mockTerminalPort.clearExecutedCommands();
                await terminalProvider.executeCommand(cmd);
                expect(mockTerminalPort.getExecutedCommands()).toContain(cmd);
            }
        });
        it('should accept valid git commands', async () => {
            // Arrange
            const gitCommands = ['git status', 'git log', 'git branch'];
            // Act & Assert
            for (const cmd of gitCommands) {
                mockTerminalPort.clearExecutedCommands();
                await terminalProvider.executeCommand(cmd);
                expect(mockTerminalPort.getExecutedCommands()).toContain(cmd);
            }
        });
        it('should handle commands with arguments', async () => {
            // Act
            await terminalProvider.executeCommand('npm run test -- --coverage');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('npm run test -- --coverage');
        });
        it('should handle commands with quotes', async () => {
            // Act
            await terminalProvider.executeCommand('echo "Hello World"');
            // Assert
            const executed = mockTerminalPort.getExecutedCommands();
            expect(executed).toContain('echo "Hello World"');
        });
    });
});
//# sourceMappingURL=TerminalViewProvider.test.js.map