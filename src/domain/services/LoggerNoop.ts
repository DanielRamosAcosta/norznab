import type { Logger } from "./Logger.ts";

export class LoggerNoop implements Logger {
  forClass(name: string): Logger {
    return this;
  }

  forMethod(name: string): Logger {
    return this;
  }

  trace(msg: string, object?: unknown) {}

  debug(msg: string, object?: unknown) {}

  info(msg: string, object?: unknown) {}

  warn(msg: string, object?: unknown) {}

  error(msg: string, object?: unknown) {}
}
