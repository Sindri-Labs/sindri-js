#! /usr/bin/env node
import { argv, exit } from "process";

import chalk from "chalk";
import { Command } from "@commander-js/extra-typings";

import { configCommand } from "cli/config";
import { execCommand } from "cli/exec";
import { initCommand } from "cli/init";
import { deployCommand } from "cli/deploy";
import { lintCommand } from "cli/lint";
import { loginCommand } from "cli/login";
import { logoutCommand } from "cli/logout";
import { whoamiCommand } from "cli/whoami";
import { loadPackageJson } from "cli/utils";
import sindri from "lib";

export const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version(loadPackageJson().version ?? "unknown")
  .enablePositionalOptions()
  .option("-d, --debug", "Enable debug logging.", false)
  .option(
    "-q, --quiet",
    "Disable all logging aside from direct command outputs for programmatic consumption.",
    false,
  )
  .addCommand(configCommand)
  .addCommand(execCommand)
  .addCommand(initCommand)
  .addCommand(deployCommand)
  .addCommand(lintCommand)
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(whoamiCommand)
  // Parse the base command options and respond to them before invoking the subcommand.
  .hook("preAction", async (command) => {
    console.log(chalk.blue("hello!"));
    // Set the logging level.
    const { debug, quiet } = command.opts();
    if (debug && quiet) {
      sindri.logLevel = "error";
      sindri.logger.error(
        "You cannot specify both the `--debug` and `--quiet` arguments.",
      );
      return exit(1);
    }
    if (debug) {
      sindri.logLevel = "trace";
    } else if (quiet) {
      sindri.logLevel = "silent";
    } else {
      sindri.logLevel = "info";
    }
  });

if (require.main === module) {
  program.parse(argv);
}
