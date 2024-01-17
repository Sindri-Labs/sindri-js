import { existsSync, readFileSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import type { Schema } from "jsonschema";
import { Validator as JsonValidator } from "jsonschema";

import { findFileUpwards, loadSindriManifestJsonSchema } from "cli/utils";
import { logger } from "lib/logging";

export const lintCommand = new Command()
  .name("lint")
  .description("Lint the current Sindri project for potential issues.")
  .argument(
    "[directory]",
    "The directory, or subdirectory, of the project to lint.",
    ".",
  )
  .action(async (directory) => {
    // Track the error and warning counts as we go.
    let errorCount: number = 0;
    let warningCount: number = 0;

    // Load the Sindri Manifest JSON Schema.
    let sindriManifestJsonSchema: Schema | undefined;
    try {
      sindriManifestJsonSchema = loadSindriManifestJsonSchema();
      if (!sindriManifestJsonSchema) {
        throw new Error('No "sindri-manifest.json" file found.');
      }
      logger.debug('Successfully loaded "sindri-manifest.json".');
    } catch (error) {
      logger.error(
        'No "sindri-manifest.json" JSON Schema file found. Aborting.',
      );
      return process.exit(1);
    }

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

    // Validate `sindri.json`.
    const manifestValidator = new JsonValidator();
    const validationStatus = manifestValidator.validate(
      sindriJson,
      sindriManifestJsonSchema,
      { nestedErrors: true },
    );
    if (validationStatus.valid) {
      logger.info(`Sindri manifest file "${sindriJsonPath}" is valid.`);
    } else {
      logger.warn(`Sindri manifest file "${sindriJsonPath}" contains errors:`);
      for (const error of validationStatus.errors) {
        const prefix =
          error.property
            .replace(/^instance/, "sindri.json")
            .replace(/\./g, ":") +
          (typeof error.schema === "object" && error.schema.title
            ? `:${error.schema.title}`
            : "");
        logger.error(`${prefix} ${error.message}`);
        errorCount += 1;
      }
    }

    // Check for a project README.
    const readmePath = path.join(rootDirectory, "README.md");
    if (!existsSync(readmePath)) {
      logger.warn(
        `No project README was found at "${readmePath}", consider adding one.`,
      );
      warningCount += 1;
    } else {
      logger.debug(`README file found at "${readmePath}".`);
    }

    // Summarize the errors and warnings.
    if (errorCount === 0 && warningCount === 0) {
      logger.info("No issues found, good job!");
    } else {
      logger.warn(
        `Found ${errorCount + warningCount} problems ` +
          `(${errorCount} errors, ${warningCount} warnings).`,
      );
      if (errorCount > 0) {
        logger.error(`Linting failed with ${errorCount} errors.`);
        return process.exit(1);
      }
    }
  });
