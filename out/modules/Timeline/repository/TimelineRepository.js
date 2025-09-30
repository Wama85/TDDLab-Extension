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
exports.TimelineRepository = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Timeline_1 = require("../domain/Timeline");
const CommitPoint_1 = require("../domain/CommitPoint");
class TimelineRepository {
    filePath;
    constructor(extensionPath) {
        this.filePath = path.join(extensionPath, 'script', 'tdd_log.json');
    }
    async getTimelines() {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, 'utf8', (err, data) => {
                if (err) {
                    return reject(new Error(JSON.stringify(err)));
                }
                try {
                    const jsonData = JSON.parse(data);
                    const timeline = [];
                    jsonData.forEach((item) => {
                        if (item.numPassedTests !== undefined && item.numTotalTests !== undefined) {
                            timeline.push(new Timeline_1.Timeline(item.numPassedTests, item.numTotalTests, new Date(item.timestamp), item.success));
                        }
                        else if (item.commitId && item.commitTimestamp) {
                            timeline.push(new CommitPoint_1.CommitPoint(item.commitId, item.commitName, new Date(item.commitTimestamp)));
                        }
                    });
                    resolve(timeline);
                }
                catch (error) {
                    reject(new Error('Error al parsear el archivo JSON'));
                }
            });
        });
    }
}
exports.TimelineRepository = TimelineRepository;
//# sourceMappingURL=TimelineRepository.js.map