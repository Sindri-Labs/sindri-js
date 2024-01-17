#! /usr/bin/env node
import assert from "assert";
import { argv, exit } from "process";

import { Command } from "@commander-js/extra-typings";

import { configCommand } from "cli/config";
import { initCommand } from "cli/init";
import { deployCommand } from "cli/deploy";
import { lintCommand } from "cli/lint";
import { loginCommand } from "cli/login";
import { logoutCommand } from "cli/logout";
import { whoamiCommand } from "cli/whoami";
import { loadPackageJson } from "cli/utils";
import sindri from "lib";
import { logger } from "lib/logging";

export const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version(loadPackageJson().version ?? "unknown")
  .option("-d, --debug", "Enable debug logging.", false)
  .option(
    "-q, --quiet",
    "Disable all logging aside from direct command outputs for programmatic consumption.",
    false,
  )
  .addCommand(configCommand)
  .addCommand(initCommand)
  .addCommand(deployCommand)
  .addCommand(lintCommand)
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

    // Make sure the client is loaded and initialized before any subcommands run.
    // Note that this also initializes the config.
    assert(sindri);
  });

if (require.main === module) {
  program.parse(argv);
}
