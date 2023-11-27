import { existsSync, lstatSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import { confirm } from "@inquirer/prompts";

import { logger } from "cli/logging";

export const initCommand = new Command()
  .name("init")
  .description("Initialize a new Sindri project.")
  .argument(
    "[directory]",
    "The directory where the new project should be initialized.",
    ".",
  )
  .action(async (directory) => {
    // Prepare the directory paths.
    const directoryPath = path.resolve(directory);
    const directoryName = path.basename(directoryPath);

    // Ensure that the directory exists.
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    } else if (!lstatSync(directoryPath).isDirectory()) {
      logger.warn(
        `File "${directoryPath}" exists and is not a directory, aborting.`,
      );
      return process.exit(1);
    }

    // Check that the directory is empty.
    const existingFiles = readdirSync(directoryPath);
    if (existingFiles.length > 0) {
      const proceed = await confirm({
        message:
          `The "${directoryPath}" directory already exists and contains files. Continuing may ` +
          "overwrite your files. Are you *SURE* you would like to proceed?",
        default: false,
      });
      if (!proceed) {
        logger.info("Aborting.");
        return process.exit(1);
      }
    }

    // TODO: more
  });
