"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTimeline = void 0;
const TimelineRepository_1 = require("../../application/timeline/repository/TimelineRepository");
class GetTimeline {
    timelineRepository;
    hasShownError = false;
    constructor(rootPath) {
        this.timelineRepository = new TimelineRepository_1.TimelineRepository(rootPath);
    }
    async execute() {
        let response = [];
        try {
            const timeline = await this.timelineRepository.getTimelines();
            response = timeline;
            // Si tiene éxito, resetear el flag de error
            this.hasShownError = false;
        }
        catch (error) {
            // Solo lanzar el error sin mostrar mensaje al usuario
            // El TimelineView ya maneja esto de forma silenciosa
            console.debug('[GetTimeline] No se pudo obtener el timeline (esperado en proyectos sin tests)');
            throw error; // Lanzar el error para que TimelineView lo maneje
        }
        return response;
    }
}
exports.GetTimeline = GetTimeline;
//# sourceMappingURL=GetTimeline.js.map