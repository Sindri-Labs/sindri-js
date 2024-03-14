import assert from "assert";
import { randomUUID } from "crypto";
import { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import type { Schema } from "jsonschema";
import { Validator as JsonValidator } from "jsonschema";
import type { Log as SarifLog, Result as SarifResult } from "sarif";

import {
  execCommand,
  findFileUpwards,
  loadSindriManifestJsonSchema,
} from "cli/utils";
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
          /halo2axiomv030/i.test(option["$ref"] ?? ""),
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

    // Run Circomspect for Circom circuits.
    if (circuitType === "circom") {
      try {
        // Run Circomspect and parse the results.
        sindri.logger.info(
          "Running static analysis with Circomspect by Trail of Bits...",
        );
        const sarifFile = path.join(
          "/",
          "tmp",
          "sindri",
          `circomspect-${randomUUID()}.sarif`,
        );
        let sarif: SarifLog | undefined;
        let ranInDocker: boolean;
        try {
          const circuitPath: string =
            "circuitPath" in sindriJson && sindriJson.circuitPath
              ? (sindriJson.circuitPath as string)
              : "circuit.circom";
          const { method } = await execCommand(
            "circomspect",
            ["--level", "INFO", "--sarif-file", sarifFile, circuitPath],
            {
              cwd: rootDirectory,
              logger: sindri.logger,
              rootDirectory,
              tty: false,
            },
          );
          ranInDocker = method === "docker";
          if (method !== null) {
            sindri.logger.debug("Parsing Circomspect SARIF results.");
            const sarifContent = readFileSync(sarifFile, {
              encoding: "utf-8",
            });
            sarif = JSON.parse(sarifContent);
          } else {
            sindri.logger.warn(
              "Circomspect is not installed, skipping circomspect static analysis.\n" +
                "Please install Docker by following the directions at: " +
                "https://docs.docker.com/get-docker/\n" +
                "Or install Circomspect by following the directions at: " +
                "https://github.com/trailofbits/circomspect#installing-circomspect",
            );
            warningCount += 1;
          }
        } catch (error) {
          sindri.logger.fatal(
            `Error running Circomspect in "${rootDirectory}".`,
          );
          sindri.logger.error(error);
          errorCount += 1;
        } finally {
          try {
            unlinkSync(sarifFile);
          } catch {
            // The file might not have been created successfully, so this is probably fine.
            sindri.logger.debug(
              `Failed to delete temporary SARIF file "${sarifFile}".`,
            );
          }
        }

        if (sarif) {
          // Sort the results by file, line, and column; the order we want to display them in.
          const results: SarifResult[] = sarif.runs[0]?.results ?? [];
          results.sort((a: SarifResult, b: SarifResult) => {
            if (
              !a?.locations?.length ||
              !b?.locations?.length ||
              !a.locations[0]?.physicalLocation?.artifactLocation?.uri ||
              !b.locations[0]?.physicalLocation?.artifactLocation?.uri ||
              a.locations[0]?.physicalLocation?.region?.startLine == null ||
              b.locations[0]?.physicalLocation?.region?.startLine == null ||
              a.locations[0]?.physicalLocation?.region?.startColumn == null ||
              b.locations[0]?.physicalLocation?.region?.startColumn == null
            ) {
              return 0;
            }
            const uriComparison =
              a.locations[0].physicalLocation.artifactLocation.uri.localeCompare(
                b.locations[0].physicalLocation.artifactLocation.uri,
              );
            if (uriComparison !== 0) return uriComparison;
            const lineComparision =
              a.locations[0].physicalLocation.region.startLine -
              b.locations[0].physicalLocation.region.startLine;
            if (lineComparision !== 0) return lineComparision;
            const columnComparision =
              a.locations[0].physicalLocation.region.startColumn -
              b.locations[0].physicalLocation.region.startColumn;
            return columnComparision;
          });

          // Log out the circomspect results.
          let circomspectIssueFound = false;
          results.forEach((result: SarifResult) => {
            if (
              !result?.locations?.length ||
              !result.locations[0]?.physicalLocation?.artifactLocation?.uri ||
              result.locations[0]?.physicalLocation?.region?.startLine ==
                null ||
              result.locations[0]?.physicalLocation?.region?.startColumn ==
                null ||
              !result?.message?.text
            ) {
              sindri.logger.warn(
                "Circomspect result is missing required fields, skipping.",
              );
              sindri.logger.debug(result, "Missing Circomspect result fields:");
              return;
            }

            const filePath = path.relative(
              ranInDocker ? "/sindri/" : rootDirectory,
              result.locations[0].physicalLocation.artifactLocation.uri.replace(
                /^file:\/\//,
                "",
              ),
            );
            const { startColumn, startLine } =
              result.locations[0].physicalLocation.region;
            const logMessage =
              `${filePath}:${startLine}:${startColumn} ` +
              `${result.message.text} [Circomspect: ${result.ruleId}]`;
            if (result.level === "error") {
              sindri.logger.error(logMessage);
              circomspectIssueFound = true;
              errorCount += 1;
            } else if (result.level === "warning") {
              sindri.logger.warn(logMessage);
              circomspectIssueFound = true;
              warningCount += 1;
            } else {
              sindri.logger.debug(logMessage);
            }
          });
          if (!circomspectIssueFound) {
            sindri.logger.info("No issues found with Circomspect, good job!");
          }
        }
      } catch (error) {
        sindri.logger.fatal("Error running Circomspect, aborting.");
        sindri.logger.debug(error);
        return process.exit(1);
      }
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
