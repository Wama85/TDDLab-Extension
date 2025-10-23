"use strict";
// src/presentation/__mocks__/vscode.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.TreeItemCollapsibleState = exports.TreeItem = exports.commands = exports.ViewColumn = exports.Uri = exports.workspace = exports.window = void 0;
exports.window = {
    showOpenDialog: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
    createOutputChannel: jest.fn(() => ({
        appendLine: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn(),
        show: jest.fn(),
    })),
    createTerminal: jest.fn(),
    activeTextEditor: undefined,
    showTextDocument: jest.fn(),
};
exports.workspace = {
    getConfiguration: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
        has: jest.fn(),
    })),
    workspaceFolders: [
        {
            uri: { fsPath: '/mock/workspace/path', path: '/mock/workspace/path' },
            name: 'MockWorkspace',
            index: 0,
        },
    ],
    openTextDocument: jest.fn(),
    getWorkspaceFolder: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    onDidChangeWorkspaceFolders: jest.fn(),
};
exports.Uri = {
    file: jest.fn((path) => ({
        fsPath: path,
        path,
        scheme: 'file',
        authority: '',
        query: '',
        fragment: '',
    })),
    parse: jest.fn((path) => ({
        fsPath: path,
        path,
        scheme: 'file',
        authority: '',
        query: '',
        fragment: '',
    })),
    joinPath: jest.fn((base, ...paths) => ({
        fsPath: `${base.fsPath}/${paths.join('/')}`,
        path: `${base.path}/${paths.join('/')}`,
        scheme: 'file',
        authority: '',
        query: '',
        fragment: '',
    })),
};
exports.ViewColumn = {
    Active: -1,
    Beside: -2,
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
    Seven: 7,
    Eight: 8,
    Nine: 9,
};
exports.commands = {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
};
// ⭐ AGREGAR TreeItem
class TreeItem {
    label;
    collapsibleState;
    command;
    iconPath;
    contextValue;
    constructor(label, collapsibleState) {
        this.label = label;
        this.collapsibleState = collapsibleState;
    }
}
exports.TreeItem = TreeItem;
exports.TreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
};
class EventEmitter {
    listeners = [];
    event = (listener) => {
        this.listeners.push(listener);
        return { dispose: () => { } };
    };
    fire(data) {
        this.listeners.forEach(listener => listener(data));
    }
    dispose() {
        this.listeners = [];
    }
}
exports.EventEmitter = EventEmitter;
exports.default = {
    window: exports.window,
    workspace: exports.workspace,
    Uri: exports.Uri,
    ViewColumn: exports.ViewColumn,
    commands: exports.commands,
    TreeItem,
    TreeItemCollapsibleState: exports.TreeItemCollapsibleState,
    EventEmitter,
};
//# sourceMappingURL=vscode.js.map