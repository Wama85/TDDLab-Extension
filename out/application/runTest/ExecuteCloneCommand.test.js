"use strict";
// src/application/test/ExecuteTestCommand.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const ExecuteTestCommand_1 = require("./ExecuteTestCommand");
// Mock del TestRunnerPort
class MockTestRunner {
    testResults = [];
    shouldThrowError = false;
    errorMessage = '';
    setTestResults(results) {
        this.testResults = results;
    }
    setShouldThrowError(shouldThrow, message = 'Test execution failed') {
        this.shouldThrowError = shouldThrow;
        this.errorMessage = message;
    }
    async runTests() {
        if (this.shouldThrowError) {
            throw new Error(this.errorMessage);
        }
        return this.testResults;
    }
}
describe('ExecuteTestCommand', () => {
    let mockTestRunner;
    let executeTestCommand;
    beforeEach(() => {
        mockTestRunner = new MockTestRunner();
        executeTestCommand = new ExecuteTestCommand_1.ExecuteTestCommand(mockTestRunner);
    });
    // ============================================
    // HAPPY PATH - Casos exitosos
    // ============================================
    describe('Happy Path', () => {
        it('should execute tests successfully and return results when all tests pass', async () => {
            // Arrange
            const expectedResults = [
                'PASS  src/test/sample.test.ts',
                'Tests: 5 passed, 5 total'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results.length).toBe(2);
        });
        it('should execute tests and return results when some tests fail', async () => {
            // Arrange
            const expectedResults = [
                'FAIL  src/test/sample.test.ts',
                'Tests: 3 passed, 2 failed, 5 total'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results).toContain('FAIL  src/test/sample.test.ts');
        });
        it('should return empty array when no tests are found', async () => {
            // Arrange
            mockTestRunner.setTestResults([]);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual([]);
            expect(results.length).toBe(0);
        });
        it('should execute tests and return detailed results with multiple test suites', async () => {
            // Arrange
            const expectedResults = [
                'PASS  src/test/unit/service.test.ts',
                'PASS  src/test/unit/repository.test.ts',
                'FAIL  src/test/integration/api.test.ts',
                'Tests: 15 passed, 2 failed, 17 total'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results.length).toBe(4);
            expect(results.filter(r => r.includes('PASS')).length).toBe(2);
            expect(results.filter(r => r.includes('FAIL')).length).toBe(1);
        });
        it('should handle test results with special characters and emojis', async () => {
            // Arrange
            const expectedResults = [
                '✓ PASS  src/test/sample.test.ts',
                '✓ Tests: 10 passed, 10 total 🎉'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results[0]).toContain('✓');
            expect(results[1]).toContain('🎉');
        });
    });
    // ============================================
    // INTEGRATION SCENARIOS - Escenarios de integración
    // ============================================
    describe('Integration Scenarios', () => {
        it('should execute command multiple times consecutively', async () => {
            // Arrange
            const results1 = ['PASS  test1.ts'];
            const results2 = ['PASS  test2.ts'];
            // Act & Assert - Primera ejecución
            mockTestRunner.setTestResults(results1);
            const firstRun = await executeTestCommand.execute();
            expect(firstRun).toEqual(results1);
            // Act & Assert - Segunda ejecución
            mockTestRunner.setTestResults(results2);
            const secondRun = await executeTestCommand.execute();
            expect(secondRun).toEqual(results2);
        });
        it('should handle test execution with coverage information', async () => {
            // Arrange
            const expectedResults = [
                'PASS  src/test/sample.test.ts',
                'Coverage: 85%',
                'Tests: 10 passed, 10 total'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results.some(r => r.includes('Coverage'))).toBe(true);
        });
        it('should handle test execution with snapshot updates', async () => {
            // Arrange
            const expectedResults = [
                'PASS  src/test/sample.test.ts',
                'Snapshots: 3 updated',
                'Tests: 5 passed, 5 total'
            ];
            mockTestRunner.setTestResults(expectedResults);
            // Act
            const results = await executeTestCommand.execute();
            // Assert
            expect(results).toEqual(expectedResults);
            expect(results.some(r => r.includes('Snapshots'))).toBe(true);
        });
    });
});
//# sourceMappingURL=ExecuteCloneCommand.test.js.map