import pino from "pino";
import pretty from "pino-pretty";

export const logger = pino(
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

logger.level = process.env.NODE_ENV === "production" ? "silent" : "info";

export const print = console.log;
