"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmRunTests = void 0;
class NpmRunTests {
    terminal;
    constructor(terminal) {
        this.terminal = terminal;
    }
    async execute() {
        const output = await this.terminal.runCommand("npm test");
        // TODO: parsear resultados reales desde el output
        return [{ name: "dummy test", success: true, duration: 50 }];
    }
}
exports.NpmRunTests = NpmRunTests;
//# sourceMappingURL=NpmRunTests.js.map