import pino from "pino";

export const loggerPinoOptions: pino.LoggerOptions = {
  // Overridable at runtime via LOG_LEVEL (e.g. "info", "debug", "trace").
  level:
    process.env.NODE_ENV === "test"
      ? "silent"
      : (process.env.LOG_LEVEL ?? "debug"),
  formatters: {
    level: (label) => ({ level: label }),
  },
};
