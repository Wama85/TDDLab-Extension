"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NpmRunTests = void 0;
class NpmRunTests {
    terminalProvider;
    constructor(terminalProvider) {
        this.terminalProvider = terminalProvider;
    }
    async runTests() {
        this.terminalProvider.sendToTerminal('🚀 Ejecutando: npm run test');
        return ['npm run test ejecutado en TDDLab'];
    }
}
exports.NpmRunTests = NpmRunTests;
//# sourceMappingURL=NpmRunTests.js.map