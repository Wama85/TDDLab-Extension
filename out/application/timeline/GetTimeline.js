"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTimeline = void 0;
const TimelineRepository_1 = require("../../application/timeline/repository/TimelineRepository");
class GetTimeline {
    constructor(rootPath) {
        this.hasShownError = false;
        this.timelineRepository = new TimelineRepository_1.TimelineRepository(rootPath);
    }
    async execute() {
        let response = [];
        try {
            const timeline = await this.timelineRepository.getTimelines();
            response = timeline;
            this.hasShownError = false;
        }
        catch (error) {
            console.debug('[GetTimeline] No se pudo obtener el timeline (esperado en proyectos sin tests)');
            throw error;
        }
        return response;
    }
}
exports.GetTimeline = GetTimeline;
//# sourceMappingURL=GetTimeline.js.map