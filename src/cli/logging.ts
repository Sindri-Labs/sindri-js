import process from "process";

import pino from "pino";

export const logger = pino(
  {
    transport: {
      options: {
        // Write all logs to stderr.
        destination: 2,
        // Write synchronously so logs appear before inquirer prompts.
        sync: true,
      },
      // Pretty print instead of JSON logging.
      target: "pino-pretty",
    },
  },
  process.stdout,
);

export const print = console.log;
