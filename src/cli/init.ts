import { existsSync, statSync, mkdirSync, readdirSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import { confirm, input, select } from "@inquirer/prompts";

import { logger } from "cli/logging";
import { scaffoldDirectory } from "cli/utils";

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
    } else if (!statSync(directoryPath).isDirectory()) {
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

    // Collect common fields.
    const circuitName = await input({
      message: "Circuit Name:",
      default: directoryName,
    });
    const circuitType: "circom" | "gnark" | "halo2" | "noir" = await select({
      message: "Select a Team:",
      default: "gnark",
      choices: [
        { name: "Circom", value: "circom" },
        { name: "Gnark", value: "gnark" },
        { name: "Halo2", value: "halo2" },
        { name: "Noir", value: "noir" },
      ],
    });
    const context: object = { circuitName, circuitType };

    // Handle individual circuit types.
    if (circuitType === "gnark") {
      const provingScheme: "groth16" = await select({
        message: "Proving Scheme:",
        default: "groth16",
        choices: [{ name: "Groth16", value: "groth16" }],
      });
      const curveName: "bn254" = await select({
        message: "Curve Name:",
        default: "bn254",
        choices: [{ name: "BN254", value: "bn254" }],
      });
      Object.assign(context, { curveName, provingScheme });
    } else {
      logger.fatal(`Sorry, ${circuitType} is not yet supported.`);
      return process.exit(1);
    }

    // Perform the scaffolding.
    await scaffoldDirectory("common", directoryPath, context);
    await scaffoldDirectory(circuitType, directoryPath, context);
  });
