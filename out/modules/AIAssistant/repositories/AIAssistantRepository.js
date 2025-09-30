"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const https = __importStar(require("https"));
class AIAssistantRepository {
    createApiRequestBody(tddLog, prompt) {
        return JSON.stringify({
            tddlog: tddLog,
            prompt: prompt,
        });
    }
    handleApiResponseStream(res, resolve) {
        let responseData = "";
        res.on("data", (chunk) => (responseData += chunk));
        res.on("end", () => {
            try {
                const parsed = JSON.parse(responseData);
                resolve(`Respuesta IA: ${parsed.analysis}`);
            }
            catch {
                resolve(`Respuesta no válida: ${responseData}`);
            }
        });
    }
    createApiRequest(data, resolve, reject) {
        return https.request({
            hostname: "tdd-lab-api-staging.vercel.app",
            path: "/api/AIAssistant/analyze-tdd-extension",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data),
            },
        }, (res) => this.handleApiResponseStream(res, resolve)).on("error", reject);
    }
    getTDDFeedback(data) {
        return new Promise((resolve, reject) => {
            const req = this.createApiRequest(data, resolve, reject);
            req.write(data);
            req.end();
        });
    }
    async getTDDFeedbackFromAI(tddLog, prompt) {
        const body = this.createApiRequestBody(tddLog, prompt);
        console.log("BODY", body);
        const response = await this.getTDDFeedback(body);
        return response;
    }
    async fetchResponse(context, fileRepo) {
        try {
            const tddLog = fileRepo.getTDDLog();
            const prompt = fileRepo.getPrompt();
            return await this.getTDDFeedbackFromAI(tddLog, prompt);
        }
        catch (error) {
            console.error("Error en fetchResponse:", error);
            throw error;
        }
    }
}
exports.default = AIAssistantRepository;
//# sourceMappingURL=AIAssistantRepository.js.map