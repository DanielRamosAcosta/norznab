import { tryGetContext } from "hono/context-storage";
import pino from "pino";
import type { Logger } from "./Logger.ts";
import { loggerPinoOptions } from "./LoggerPinoOptions.ts";

export class LoggerPino implements Logger {
  private static instance?: LoggerPino;

  public static create(): LoggerPino {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new LoggerPino();

    return this.instance;
  }

  private logger: pino.Logger = pino(loggerPinoOptions);

  constructor(logger = pino(loggerPinoOptions)) {
    this.logger = logger;
  }

  forClass(name: string): Logger {
    return new LoggerPino(this.logger.child({ class: name }));
  }

  forMethod(name: string): Logger {
    return new LoggerPino(this.logger.child({ class: name }));
  }

  trace(msg: string, object: object = {}) {
    const c = tryGetContext();
    this.logger.trace({ ...object, requestId: c?.get("requestId") }, msg);
  }

  debug(msg: string, object: object = {}) {
    const c = tryGetContext();
    this.logger.debug({ ...object, requestId: c?.get("requestId") }, msg);
  }

  info(msg: string, object: object = {}) {
    const c = tryGetContext();
    this.logger.info({ ...object, requestId: c?.get("requestId") }, msg);
  }

  warn(msg: string, object: object = {}) {
    const c = tryGetContext();
    this.logger.warn({ ...object, requestId: c?.get("requestId") }, msg);
  }

  error(msg: string, object: object = {}) {
    const c = tryGetContext();
    this.logger.error({ ...object, requestId: c?.get("requestId") }, msg);
  }
}
