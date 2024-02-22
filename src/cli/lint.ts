import assert from "assert";
import { existsSync, readFileSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import type { Schema } from "jsonschema";
import { Validator as JsonValidator } from "jsonschema";

import { findFileUpwards, loadSindriManifestJsonSchema } from "cli/utils";
import sindri from "lib";

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
      sindri.logger.debug('Successfully loaded "sindri-manifest.json".');
    } catch (error) {
      sindri.logger.error(
        'No "sindri-manifest.json" JSON Schema file found. Aborting.',
      );
      return process.exit(1);
    }

    // Find `sindri.json` and move into the root of the project directory.
    const directoryPath = path.resolve(directory);
    if (!existsSync(directoryPath)) {
      sindri.logger.error(
        `The "${directoryPath}" directory does not exist. Aborting.`,
      );
      return process.exit(1);
    }
    const sindriJsonPath = findFileUpwards(/^sindri.json$/i, directoryPath);
    if (!sindriJsonPath) {
      sindri.logger.error(
        `No "sindri.json" file was found in or above "${directoryPath}". Aborting.`,
      );
      return process.exit(1);
    }
    sindri.logger.debug(`Found "sindri.json" at "${sindriJsonPath}".`);
    const rootDirectory = path.dirname(sindriJsonPath);
    sindri.logger.debug(`Changing current directory to "${rootDirectory}".`);
    process.chdir(directoryPath);

    // Load `sindri.json`.
    let sindriJson: object = {};
    try {
      const sindriJsonContent = readFileSync(sindriJsonPath, {
        encoding: "utf-8",
      });
      sindriJson = JSON.parse(sindriJsonContent);
      sindri.logger.debug(
        `Successfully loaded "sindri.json" from "${sindriJsonPath}":`,
      );
      sindri.logger.debug(sindriJson);
    } catch (error) {
      sindri.logger.fatal(
        `Error loading "${sindriJsonPath}", perhaps it is not valid JSON?`,
      );
      sindri.logger.error(error);
      return process.exit(1);
    }

    // Determine the circuit type and manually discriminate the subschema type to narrow down the
    // schema so that the user gets more relevant validation errors.
    assert(Array.isArray(sindriManifestJsonSchema.anyOf));
    let subSchema: Schema | undefined;
    if (!("circuitType" in sindriJson) || !sindriJson.circuitType) {
      subSchema = undefined;
    } else if (sindriJson.circuitType === "circom") {
      subSchema = sindriManifestJsonSchema.anyOf.find((option: Schema) =>
        /circom/i.test(option["$ref"] ?? ""),
      );
    } else if (sindriJson.circuitType === "gnark") {
      subSchema = sindriManifestJsonSchema.anyOf.find((option: Schema) =>
        /gnark/i.test(option["$ref"] ?? ""),
      );
    } else if (sindriJson.circuitType === "halo2") {
      if (
        "halo2Version" in sindriJson &&
        sindriJson.halo2Version === "axiom-v0.2.2"
      ) {
        subSchema = sindriManifestJsonSchema.anyOf.find((option: Schema) =>
          /halo2axiomv022/i.test(option["$ref"] ?? ""),
        );
      } else if (
        "halo2Version" in sindriJson &&
        sindriJson.halo2Version === "axiom-v0.3.0"
      ) {
        subSchema = sindriManifestJsonSchema.anyOf.find((option: Schema) =>
          /halo2axiomv022/i.test(option["$ref"] ?? ""),
        );
      } else {
        // We can't discriminate the different halo2 manifests if there's not a valid `halo2Version`
        // so we'll just filter down the `anyOf` to the halo2 manifests instead of picking one.
        subSchema = {
          anyOf: sindriManifestJsonSchema.anyOf.filter((option: Schema) =>
            /halo2/i.test(option["$ref"] ?? ""),
          ),
        };
      }
    } else if (sindriJson.circuitType === "noir") {
      subSchema = sindriManifestJsonSchema.anyOf.find((option: Schema) =>
        /noir/i.test(option["$ref"] ?? ""),
      );
    }
    if (subSchema) {
      delete sindriManifestJsonSchema.anyOf;
      sindriManifestJsonSchema = { ...sindriManifestJsonSchema, ...subSchema };
    } else {
      sindri.logger.warn(
        `Circuit type is not configured in "${sindriJsonPath}" so some linting steps will be ` +
          "skipped and the manifest linting output will be very noisy. Please correct " +
          '"circuiType" in "sindri.json" and rerun "sindri lint" to get better linting.',
      );
      warningCount += 1;
    }
    const circuitType: "circom" | "gnark" | "halo2" | "noir" | null =
      "circuitType" in sindriJson &&
      typeof sindriJson.circuitType === "string" &&
      ["circom", "gnark", "halo2", "noir"].includes(sindriJson.circuitType)
        ? (sindriJson.circuitType as "circom" | "gnark" | "halo2" | "noir")
        : null;
    if (circuitType) {
      sindri.logger.debug(`Detected circuit type "${circuitType}".`);
    } else {
      sindri.logger.debug("No circuit type detected!");
    }

    // Validate `sindri.json`.
    const manifestValidator = new JsonValidator();
    const validationStatus = manifestValidator.validate(
      sindriJson,
      sindriManifestJsonSchema,
      { nestedErrors: true },
    );
    if (validationStatus.valid) {
      sindri.logger.info(`Sindri manifest file "${sindriJsonPath}" is valid.`);
    } else {
      sindri.logger.warn(
        `Sindri manifest file "${sindriJsonPath}" contains errors:`,
      );
      for (const error of validationStatus.errors) {
        const prefix =
          error.property
            .replace(/^instance/, "sindri.json")
            .replace(/\./g, ":") +
          (typeof error.schema === "object" && error.schema.title
            ? `:${error.schema.title}`
            : "");
        sindri.logger.error(`${prefix} ${error.message}`);
        errorCount += 1;
      }
    }

    // Check for a project README.
    const readmePath = path.join(rootDirectory, "README.md");
    if (!existsSync(readmePath)) {
      sindri.logger.warn(
        `No project README was found at "${readmePath}", consider adding one.`,
      );
      warningCount += 1;
    } else {
      sindri.logger.debug(`README file found at "${readmePath}".`);
    }

    // Summarize the errors and warnings.
    if (errorCount === 0 && warningCount === 0) {
      sindri.logger.info("No issues found, good job!");
    } else {
      sindri.logger.warn(
        `Found ${errorCount + warningCount} problems ` +
          `(${errorCount} errors, ${warningCount} warnings).`,
      );
      if (errorCount > 0) {
        sindri.logger.error(`Linting failed with ${errorCount} errors.`);
        return process.exit(1);
      }
    }
  });
