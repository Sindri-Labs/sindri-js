import pino from "pino";
import pretty from "pino-pretty";

const prettyStream = pretty({
  colorize: true,
  destination: 2,
  ignore: "hostname,pid",
  levelFirst: false,
  sync: true,
});

export const logger = pino(prettyStream);

export const print = console.log;
