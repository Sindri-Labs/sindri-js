import pino, { type BaseLogger as Logger } from "pino";
import pretty from "pino-pretty";

export type { Logger };

/**
 * The minimum log level to print.
 */
export type LogLevel =
  | "silent"
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace";

export const createLogger = (level?: LogLevel): Logger => {
  const logger = pino(
    process.env.BROWSER_BUILD
      ? {
          browser: { asObject: true },
        }
      : pretty({
          colorize: true,
          destination: 2,
          ignore: "hostname,pid",
          levelFirst: false,
          sync: true,
        }),
  );
  logger.level =
    level ?? process.env.NODE_ENV === "production" ? "silent" : "info";
  return logger;
};
export const logger = createLogger();

export const print = console.log;
