#! /usr/bin/env node
import { argv, exit } from "process";

import { Command } from "@commander-js/extra-typings";

import { Config, configCommand } from "cli/config";
import { initCommand } from "cli/init";
import { deployCommand } from "cli/deploy";
import { lintCommand } from "cli/lint";
import { logger } from "cli/logging";
import { loginCommand } from "cli/login";
import { logoutCommand } from "cli/logout";
import { proofCommand } from "cli/proof";
import { whoamiCommand } from "cli/whoami";
import { loadPackageJson } from "cli/utils";

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
  .addCommand(proofCommand)
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

if (require.main === module) {
  program.parse(argv);
}
