#! /usr/bin/env node
import { argv, exit } from "process";

import { Command } from "@commander-js/extra-typings";

import { cloneCommand } from "cli/clone";
import { configCommand } from "cli/config";
import { execCommand } from "cli/exec";
import { initCommand } from "cli/init";
import { deployCommand } from "cli/deploy";
import { lintCommand } from "cli/lint";
import { loginCommand } from "cli/login";
import { logoutCommand } from "cli/logout";
import { proofCommand } from "cli/proof";
import { whoamiCommand } from "cli/whoami";
import { loadPackageJson } from "cli/utils";
import sindri from "lib";

const version = process.env.VERSION || loadPackageJson().version;
const versionTag = version ? `v${version}` : "unknown";

export const program = new Command()
  .name("sindri")
  .description("The Sindri CLI client.")
  .version(versionTag)
  .enablePositionalOptions()
  .option("-d, --debug", "Enable debug logging.", false)
  .option(
    "-q, --quiet",
    "Disable all logging aside from direct command outputs for programmatic consumption.",
    false,
  )
  .addCommand(cloneCommand)
  .addCommand(configCommand)
  .addCommand(execCommand)
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

    // Set the `Sindri-Client` header.
    sindri._clientConfig.HEADERS = {
      ...sindri._clientConfig.HEADERS,
      "Sindri-Client": `sindri-js-cli/${versionTag}`,
    };
  });

if (require.main === module) {
  program.parse(argv);
}
