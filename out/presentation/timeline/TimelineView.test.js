"use strict";
// src/presentation/timeline/TimelineView.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const TimelineView_1 = require("./TimelineView");
const Timeline_1 = require("../../domain/timeline/Timeline");
const GetTimeline_1 = require("../../application/timeline/GetTimeline");
// Mock de GetTimeline
// Aquí se mockea el módulo completo para poder espiar o reemplazar su implementación
jest.mock('../../application/timeline/GetTimeline', () => {
    return {
        GetTimeline: jest.fn().mockImplementation(() => {
            return {
                execute: jest.fn(),
            };
        }),
    };
});
// Mock de GetLastPoint (aunque no se usa, se mantiene la estructura)
jest.mock('../../application/timeline/GetLastPoint');
// Obtenemos la referencia al constructor mockeado
const MockGetTimeline = GetTimeline_1.GetTimeline;
const mockExecute = MockGetTimeline.mock.results[0]?.value.execute;
class MockExtensionContext {
    extensionUri = {
        fsPath: '/mock/extension/path',
        path: '/mock/extension/path',
        scheme: 'file',
    };
    subscriptions = [];
}
describe('TimelineView - Show Timeline Tests', () => {
    let timelineView;
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        mockContext = new MockExtensionContext();
        // 1. Crear una única instancia de TimelineView
        timelineView = new TimelineView_1.TimelineView(mockContext);
        // 2. Configuración del mock por defecto para que no falle.
        // Se asume que el mock de GetTimeline ya tiene una implementación por defecto
        // con un 'execute' mockeado.
        const mockInstance = MockGetTimeline.mock.results.find((r) => r.type === 'return')?.value;
        if (mockInstance && mockInstance.execute) {
            mockInstance.execute.mockClear();
            mockInstance.execute.mockResolvedValue([]);
        }
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    // Mock Webview común
    const createMockWebview = () => ({
        html: '',
        postMessage: jest.fn(),
        asWebviewUri: (uri) => uri
    });
    describe('Timeline Display - Happy Path', () => {
        it('should display timeline with all passed tests (green dots)', async () => {
            // Arrange
            const mockTimeline = [
                new Timeline_1.Timeline(5, 5, new Date(), true),
                new Timeline_1.Timeline(3, 3, new Date(), true)
            ];
            // Reemplazar la implementación mockeada para este test
            timelineView.getTimeline.execute.mockResolvedValue(mockTimeline);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('green');
            expect(html).not.toContain('red');
        });
        it('should display timeline with failed tests (red dots)', async () => {
            // Arrange
            const mockTimeline = [
                new Timeline_1.Timeline(3, 5, new Date(), false),
                new Timeline_1.Timeline(2, 4, new Date(), false)
            ];
            timelineView.getTimeline.execute.mockResolvedValue(mockTimeline);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('red');
        });
    });
    describe('Error Handling', () => {
        it('should handle timeline not available gracefully', async () => {
            // Arrange
            timelineView.getTimeline.execute.mockRejectedValue(new Error('Timeline file not found'));
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('Sin timeline disponible');
        });
    });
    describe('Timeline with Empty Data', () => {
        // ... (Tests de Empty Data)
        it('should handle empty timeline', async () => {
            // Arrange
            timelineView.getTimeline.execute.mockResolvedValue([]);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toBeDefined();
        });
        it('should handle timeline with only test results', async () => {
            // Arrange
            const mockTimeline = [
                new Timeline_1.Timeline(5, 5, new Date(), true),
                new Timeline_1.Timeline(3, 5, new Date(), false),
                new Timeline_1.Timeline(4, 4, new Date(), true)
            ];
            timelineView.getTimeline.execute.mockResolvedValue(mockTimeline);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('timeline-dot');
            expect(html).not.toContain('git.png');
        });
    });
    describe('Timeline Visual Elements', () => {
        // ... (Tests de Visual Elements)
        it('should use 20x20 pixel dots for timeline points', async () => {
            // Arrange
            const mockTimeline = [new Timeline_1.Timeline(5, 5, new Date(), true)];
            timelineView.getTimeline.execute.mockResolvedValue(mockTimeline);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('width:20px');
            expect(html).toContain('height:20px');
        });
        it('should use circular shape for timeline dots', async () => {
            // Arrange
            const mockTimeline = [new Timeline_1.Timeline(5, 5, new Date(), true)];
            timelineView.getTimeline.execute.mockResolvedValue(mockTimeline);
            const mockWebview = createMockWebview();
            // Act
            const html = await timelineView.getTimelineHtml(mockWebview);
            // Assert
            expect(html).toContain('border-radius:50%');
        });
    });
});
//# sourceMappingURL=TimelineView.test.js.map