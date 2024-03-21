import assert from "assert";
import fs from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import tar from "tar";

import sindri from "lib";
import { ApiError } from "lib/api";

export const cloneCommand = new Command()
  .name("clone")
  .description("Clone a circuit into a local directory.")
  .argument("<circuit>", "The circuit to clone.")
  .argument("[directory]", "The directory to clone the circuit into.")
  .action(async (circuit, directory) => {
    // Validate the circuit identifier.
    const circuitIdentifierRegex =
      /^(?:([-a-zA-Z0-9_]+)\/)?([-a-zA-Z0-9_]+)(?::([-a-zA-Z0-9_.]+))?$/;
    const match = circuitIdentifierRegex.exec(circuit);
    if (!match) {
      sindri.logger.error(`"${circuit}" is not a valid circuit identifier.`);
      return process.exit(1);
    }
    assert(match[2], "The circuit name must be provided.");
    const circuitName: string = match[2];
    const outputDirectory: string = path.resolve(directory ?? circuitName);

    // Check that the output directory does not exist.
    if (fs.existsSync(outputDirectory)) {
      sindri.logger.error(
        `The directory "${outputDirectory}" already exists. Aborting.`,
      );
      return process.exit(1);
    }

    // Check that the API client is authorized.
    if (!sindri.apiKey || !sindri.baseUrl) {
      sindri.logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // Request the circuit tarball from the server.
    let responseStream: NodeJS.ReadableStream;
    sindri.logger.info(
      `Cloning the circuit "${circuit}" into "${outputDirectory}".`,
    );
    try {
      responseStream = (await sindri._client.internal.circuitDownload(
        circuit,
      )) as unknown as NodeJS.ReadableStream;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sindri.logger.error(
          "Your credentials are invalid. Please log in again with `sindri login`.",
        );
        return process.exit(1);
      } else if (error instanceof ApiError && error.status === 404) {
        sindri.logger.error(
          `The circuit "${circuit}" does not exist or you lack permission to access it.`,
        );
        return process.exit(1);
      } else {
        sindri.logger.fatal("An unknown error occurred.");
        sindri.logger.error(error);
        return process.exit(1);
      }
    }

    // Make the output directory.
    try {
      fs.mkdirSync(outputDirectory, { recursive: true });
    } catch (error) {
      sindri.logger.fatal(
        `Failed to create the directory "${outputDirectory}". Aborting.`,
      );
      sindri.logger.error(error);
      return process.exit(1);
    }

    // Extract the tarball into the output directory.
    await new Promise((resolve, reject) => {
      responseStream.on("end", resolve);
      responseStream.on("error", reject);
      responseStream.pipe(
        tar.x({
          cwd: outputDirectory,
          noChmod: true,
          noMtime: true,
          onwarn: (code: string, message: string) => {
            sindri.logger.warn(
              `While extracting tarball: ${code} - ${message}`,
            );
          },
          preserveOwner: false,
          // @ts-expect-error - `preservePaths` is missing from the library's type definitions.
          preservePaths: false,
          strip: 1,
        }),
      );
    });
    sindri.logger.info("Circuit cloned successfully.");
  });
