import pino from "pino";
import pretty from "pino-pretty";

export const logger = process.env.BROWSER_BUILD
  ? console
  : pino(
      pretty({
        colorize: true,
        destination: 2,
        ignore: "hostname,pid",
        levelFirst: false,
        sync: true,
      }),
    );

export const print = console.log;
