export interface TerminalPort {
  // Ejecutar comando y capturar salida
  executeCommand(command: string): Promise<{ output: string; error: string }>;
  // Obtener directorio actual
  getCurrentDirectory(): string;
  // Cambiar directorio
  changeDirectory(path: string): Promise<boolean>;
  // Ejecutar comando con salida en tiempo real (streaming)
  executeCommandWithStream(
    command: string, 
    onOutput: (data: string) => void, 
    onError: (data: string) => void
  ): Promise<number>;
}