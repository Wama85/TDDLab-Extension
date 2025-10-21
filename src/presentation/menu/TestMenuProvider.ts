import * as vscode from 'vscode';

export class TestMenuItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly command?: vscode.Command,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly iconPath?: { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon
  ) {
    super(label, collapsibleState);
    this.command = command;
    if (iconPath) {
      this.iconPath = iconPath;
    }
  }
}

export class TestMenuProvider implements vscode.TreeDataProvider<TestMenuItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TestMenuItem | undefined | null> =
    new vscode.EventEmitter<TestMenuItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<TestMenuItem | undefined | null> =
    
  this._onDidChangeTreeData.event;
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TestMenuItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TestMenuItem): Thenable<TestMenuItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve(this.getMenuItems());
    }
  }

  private getMenuItems(): TestMenuItem[] {
    return [
      new TestMenuItem(
        '▶️ Run Tests',
        {
          command: 'TDD.runTest',
          title: 'Run Tests'
        }
      ),
      new TestMenuItem(
        '📁 Crear Proyecto',
        {
          command: 'TDD.cloneCommand',
          title: 'Crear Proyecto TDDLab'
        }
      ),
      new TestMenuItem(
        '💬 TDD Assistant Chat',
        {
          command: 'TDD.openChat',
          title: 'Abrir Chat del Asistente TDD'
        },
        vscode.TreeItemCollapsibleState.None
      ),
      new TestMenuItem(
        '🧹 Clear Terminal',
        {
          command: 'TDD.clearTerminal',
          title: 'Clear Terminal'
        }
      ),
      new TestMenuItem(
        '📊 Show Timeline',
        {
          command: 'extension.showTimeline',
          title: 'Show Timeline'
        }
      )
    ];
  }
}