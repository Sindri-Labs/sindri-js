import fs from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";

import { Config } from "cli/config";
import { logger, print } from "cli/logging";
import { findFileUpwards } from "cli/utils";
import { ApiError, CircuitsService } from "lib/api";

const readStdin = async (): Promise<string> => {
  let inputData = "";
  return new Promise((resolve) => {
    process.stdin.on("data", (chunk) => (inputData += chunk));
    process.stdin.on("end", () => resolve(inputData));
  });
};

const proofCreateCommand = new Command()
  .name("create")
  .description("Create a proof for the circuit.")
  .option(
    "-i, --input <input>",
    "Input file for the proof (defaults to stdin).",
  )
  .option("-t, --tag <tag>", "Tag to generate the proof from.", "latest")
  .action(async ({ input, tag }) => {
    // Authorize the API client.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // Find `sindri.json` and move into the root of the project directory.
    const currentDirectoryPath = path.resolve(".");
    if (!fs.existsSync(currentDirectoryPath)) {
      logger.error(
        `The "${currentDirectoryPath}" directory does not exist. Aborting.`,
      );
      return process.exit(1);
    }
    const sindriJsonPath = findFileUpwards(
      /^sindri.json$/i,
      currentDirectoryPath,
    );
    if (!sindriJsonPath) {
      logger.error(
        `No "sindri.json" file was found in or above "${currentDirectoryPath}". Aborting.`,
      );
      return process.exit(1);
    }
    logger.debug(`Found "sindri.json" at "${sindriJsonPath}".`);
    const rootDirectory = path.dirname(sindriJsonPath);
    logger.debug(`Changing current directory to "${rootDirectory}".`);
    process.chdir(rootDirectory);

    // Load `sindri.json` and find the circuit name.
    let sindriJson: object = {};
    try {
      const sindriJsonContent = fs.readFileSync(sindriJsonPath, {
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
    if (!("name" in sindriJson)) {
      logger.error('No "name" field found in "sindri.json". Aborting.');
      return process.exit(1);
    }
    const circuitName = sindriJson.name;

    // Reed in the proof input.
    let proofInput: string | undefined;
    if (input && fs.existsSync(input)) {
      // Read from the specified input file.
      proofInput = fs.readFileSync(input, "utf-8");
    } else if (!process.stdin.isTTY) {
      // Read from stdin in a non-TTY context.
      proofInput = await readStdin();
    } else {
      // Try to load from common input filenames.
      const defaultInputFiles = [
        "input.json",
        "example-input.json",
        "Prover.toml",
      ];
      for (const file of defaultInputFiles) {
        const qualifiedFile = path.join(rootDirectory, file);
        if (fs.existsSync(file)) {
          proofInput = fs.readFileSync(qualifiedFile, "utf-8");
          break;
        }
      }

      if (!proofInput) {
        console.error(
          "No input file specified, none of the default files found, and not in a non-TTY context.",
        );
        process.exit(1);
      }
    }

    const circuitIdentifier = `${circuitName}:${tag}`;
    try {
      const response = await CircuitsService.proofCreate(circuitIdentifier, {
        proof_input: proofInput,
      });
      logger.debug(`/api/v1/circuit/${circuitIdentifier}/prove/ response:`);
      logger.debug(response);
      print({
        proofId: response.proof_id,
        proof: response.proof,
        public: response.public,
        verificationKey: response.verification_key,
      });
    } catch (error) {
      // TODO: Better error handling.
      if (error instanceof ApiError && error.status === 404) {
        logger.error(
          `No circuit found with the name "${circuitName}" and tag "${tag}".`,
        );
      } else {
        logger.fatal("An unknown error occurred.");
        logger.error(error);
        return process.exit(1);
      }
    }
  });

export const proofCommand = new Command()
  .name("proof")
  .description("Commands related to proofs for the current circuit.")
  .addCommand(proofCreateCommand);
