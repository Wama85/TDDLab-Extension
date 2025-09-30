"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteTestCommand = void 0;
class ExecuteTestCommand {
    testRunner;
    constructor(testRunner) {
        this.testRunner = testRunner;
    }
    async execute() {
        return await this.testRunner.runTests();
    }
}
exports.ExecuteTestCommand = ExecuteTestCommand;
//# sourceMappingURL=ExecuteTestCommand.js.map