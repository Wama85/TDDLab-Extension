"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalIO = void 0;
class TerminalIO {
    term;
    constructor(term) {
        this.term = term;
    }
    onInput(callback) {
        this.term.onData(callback);
    }
    write(message) {
        this.term.write(message);
    }
    clear() {
        this.term.clear();
    }
    prompt() {
        this.term.write('\r\n$ ');
    }
}
exports.TerminalIO = TerminalIO;
//# sourceMappingURL=TerminalIO.js.map