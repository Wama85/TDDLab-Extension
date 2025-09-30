"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteTestCommand = void 0;
class ExecuteTestCommand {
    terminalPort;
    constructor(terminalPort) {
        this.terminalPort = terminalPort;
    }
    async execute() {
        this.terminalPort.createAndExecuteCommand('TDD Terminal', 'npm run test');
    }
}
exports.ExecuteTestCommand = ExecuteTestCommand;
//# sourceMappingURL=ExecuteTestCommand.js.map