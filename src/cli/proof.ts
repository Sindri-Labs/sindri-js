import fs from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";

import { findFileUpwards } from "cli/utils";
import sindri from "lib";
import { ApiError } from "lib/api";
import { print } from "lib/logging";

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
    "Input file for the proof (defaults to stdin if non-TTY; " +
      "`input.json`, `example-input.json`, or `Prover.toml` otherwise).",
  )
  .option("-t, --tag <tag>", "Tag to generate the proof from.", "latest")
  .option(
    "-v, --verify",
    "Perform verification of the proof after creating it.",
  )
  .action(async ({ input, tag, verify }) => {
    // Check that the API client is authorized.
    if (!sindri.apiKey || !sindri.baseUrl) {
      sindri.logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // Find `sindri.json` and move into the root of the project directory.
    const currentDirectoryPath = path.resolve(".");
    if (!fs.existsSync(currentDirectoryPath)) {
      sindri.logger.error(
        `The "${currentDirectoryPath}" directory does not exist. Aborting.`,
      );
      return process.exit(1);
    }
    const sindriJsonPath = findFileUpwards(
      /^sindri.json$/i,
      currentDirectoryPath,
    );
    if (!sindriJsonPath) {
      sindri.logger.error(
        `No "sindri.json" file was found in or above "${currentDirectoryPath}". Aborting.`,
      );
      return process.exit(1);
    }
    sindri.logger.debug(`Found "sindri.json" at "${sindriJsonPath}".`);
    const rootDirectory = path.dirname(sindriJsonPath);
    sindri.logger.debug(`Changing current directory to "${rootDirectory}".`);
    process.chdir(rootDirectory);

    // Load `sindri.json` and find the circuit name.
    let sindriJson: object = {};
    try {
      const sindriJsonContent = fs.readFileSync(sindriJsonPath, {
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
    if (!("name" in sindriJson)) {
      sindri.logger.error('No "name" field found in "sindri.json". Aborting.');
      return process.exit(1);
    }
    const circuitName = sindriJson.name;

    // Reed in the proof input.
    let proofInput: string | undefined;
    if (input && fs.existsSync(input)) {
      // Read from the specified input file.
      proofInput = fs.readFileSync(input, "utf-8");
    } else if (!process.stdin.isTTY || input === "-") {
      // Read from stdin in a non-TTY context.
      proofInput = await readStdin();
    }
    if (!proofInput || !proofInput.trim()) {
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

    // Only Circom supports smart contract calldata right now, so we only enable it for that circuit
    // type. We'll need to update this as we add support for more circuit types.
    const includeSmartContractCalldata =
      "circuitType" in sindriJson &&
      typeof sindriJson.circuitType === "string" &&
      ["circom"].includes(sindriJson.circuitType);

    const circuitIdentifier = `${circuitName}:${tag}`;
    try {
      // Poll for proof generation to complete.
      const startTime = Date.now();
      const response = await sindri.proveCircuit(
        circuitIdentifier,
        proofInput,
        !!verify,
        includeSmartContractCalldata,
      );
      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      // Check that the status is "Ready" or log an error.
      if (response.status === "Ready") {
        sindri.logger.info(
          `Proof generated successfully after ${elapsedSeconds} seconds.`,
        );
      } else if (response.status === "Failed") {
        sindri.logger.error(
          `Proof generation failed after ${elapsedSeconds} seconds: ` +
            (response.error ?? "Unknown error."),
        );
        return process.exit(1);
      } else {
        sindri.logger.fatal(`Unexpected response status: ${response.status}`);
        return process.exit(1);
      }

      // Print out the formatted proof response.
      print(
        JSON.stringify(
          {
            proofId: response.proof_id,
            proof: response.proof,
            public: response.public,
            // TODO: We need to figure out if this is the format we want to expose.
            // smart_contract_calldata: response.smart_contract_calldata,
            verification_key: response.verification_key,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      // TODO: Better error handling.
      if (error instanceof ApiError && error.status === 404) {
        sindri.logger.error(
          `No circuit found with the name "${circuitName}" and tag "${tag}".`,
        );
      } else {
        sindri.logger.fatal("An unknown error occurred.");
        sindri.logger.error(error);
      }
      return process.exit(1);
    }
  });

export const proofCommand = new Command()
  .name("proof")
  .description("Commands related to proofs for the current circuit.")
  .addCommand(proofCreateCommand);
