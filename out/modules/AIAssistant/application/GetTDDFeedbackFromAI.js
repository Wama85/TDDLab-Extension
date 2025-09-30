"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTDDFeedbackFromAI = void 0;
const AIAssistantRepository_1 = __importDefault(require("../repositories/AIAssistantRepository"));
const FileRepository_1 = __importDefault(require("../repositories/FileRepository"));
class GetTDDFeedbackFromAI {
    fileRepository;
    aIAssistantRepository;
    constructor(fileRepository = new FileRepository_1.default(), aIAssistantRepository = new AIAssistantRepository_1.default()) {
        this.fileRepository = fileRepository;
        this.aIAssistantRepository = aIAssistantRepository;
    }
    async sendTDDLogAndGetFeedback(context) {
        return await this.aIAssistantRepository.fetchResponse(context, this.fileRepository);
    }
    async getSimpleResponse(prompt) {
        const tddlog = {};
        return await this.aIAssistantRepository.getTDDFeedbackFromAI(tddlog, prompt);
    }
}
exports.GetTDDFeedbackFromAI = GetTDDFeedbackFromAI;
//# sourceMappingURL=GetTDDFeedbackFromAI.js.map