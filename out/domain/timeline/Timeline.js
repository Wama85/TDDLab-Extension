"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timeline = void 0;
class Timeline {
    constructor(numPassedTests, numTotalTests, timestamp, success) {
        this.numPassedTests = numPassedTests;
        this.numTotalTests = numTotalTests;
        this.timestamp = timestamp;
        this.success = success;
    }
    getColor() {
        return this.success && this.numTotalTests !== 0 ? "green" : "red";
    }
}
exports.Timeline = Timeline;
//# sourceMappingURL=Timeline.js.map