export interface TerminalPort {
  createAndExecuteCommand(terminalName: string, command: string): Promise<{output: string, error: string}>;
}