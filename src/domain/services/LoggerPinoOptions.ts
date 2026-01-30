import pino from "pino";

export const loggerPinoOptions: pino.LoggerOptions = {
  level: process.env.NODE_ENV === "test" ? "silent" : "debug",
  formatters: {
    level: (label) => ({ level: label }),
  },
};
