"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteTestCommand = void 0;
class ExecuteTestCommand {
    runTests;
    constructor(runTests) {
        this.runTests = runTests;
    }
    async execute() {
        return await this.runTests.execute();
    }
}
exports.ExecuteTestCommand = ExecuteTestCommand;
//# sourceMappingURL=ExecuteTestCommand.js.map