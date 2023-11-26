#! /usr/bin/env node
import { argv, exit } from "process";

import { Command } from "@commander-js/extra-typings";

import { Config, configCommand } from "cli/config";
import { logger } from "cli/logging";
import { loginCommand } from "cli/login";
import { logoutCommand } from "cli/logout";
import { whoamiCommand } from "cli/whoami";

export const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version(process.env.npm_package_version ?? "0.0.0")
  .option("-d, --debug", "Enable debug logging.", false)
  .option(
    "-q, --quiet",
    "Disable all logging aside from direct command outputs for programmatic consumption.",
    false,
  )
  .addCommand(configCommand)
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(whoamiCommand)
  // Parse the base command options and respond to them before invoking the subcommand.
  .hook("preAction", async (command) => {
    // Set the logging level.
    const { debug, quiet } = command.opts();
    if (debug && quiet) {
      logger.error(
        "You cannot specify both the `--debug` and `--quiet` arguments.",
      );
      return exit(1);
    }
    if (debug) {
      logger.level = "trace";
    } else if (quiet) {
      logger.level = "silent";
    } else {
      logger.level = "info";
    }
    logger.debug(`Set log level to "${logger.level}".`);

    // Force the loading of the config before subcommands.
    new Config();
  });

program.parse(argv);
