import { existsSync, readFileSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";

import { logger } from "cli/logging";
import { findFileUpwards } from "cli/utils";

export const lintCommand = new Command()
  .name("lint")
  .description("Lint the current `sindri.json` project for potential issues.")
  .argument(
    "[directory]",
    "The directory where the new project should be initialized.",
    ".",
  )
  .action(async (directory) => {
    // Find `sindri.json` and move into the root of the project directory.
    const directoryPath = path.resolve(directory);
    if (!existsSync(directoryPath)) {
      logger.error(
        `The "${directoryPath}" directory does not exist. Aborting.`,
      );
      return process.exit(1);
    }
    const sindriJsonPath = findFileUpwards(/^sindri.json$/i, directoryPath);
    if (!sindriJsonPath) {
      logger.error(
        `No "sindri.json" file was found in or above "${directoryPath}". Aborting.`,
      );
      return process.exit(1);
    }
    logger.debug(`Found "sindri.json" at "${sindriJsonPath}".`);
    const rootDirectory = path.dirname(sindriJsonPath);
    logger.debug(`Changing current directory to "${rootDirectory}".`);
    process.chdir(directoryPath);

    // Load `sindri.json`.
    let sindriJson: object = {};
    try {
      const sindriJsonContent = readFileSync(sindriJsonPath, {
        encoding: "utf-8",
      });
      sindriJson = JSON.parse(sindriJsonContent);
      logger.debug(
        `Successfully loaded "sindri.json" from "${sindriJsonPath}":`,
      );
      logger.debug(sindriJson);
    } catch (error) {
      logger.fatal(
        `Error loading "${sindriJsonPath}", perhaps it is not valid JSON?`,
      );
      logger.error(error);
      return process.exit(1);
    }
  });
