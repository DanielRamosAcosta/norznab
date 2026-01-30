export interface Logger {
  forClass(name: string): Logger;
  forMethod(name: string): Logger;
  trace(msg: string, object?: unknown): void;
  debug(msg: string, object?: unknown): void;
  info(msg: string, object?: unknown): void;
  warn(msg: string, object?: unknown): void;
  error(msg: string, object?: unknown): void;
}
