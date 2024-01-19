import { Blob } from "buffer";
import { existsSync, readFileSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import { FormData } from "formdata-node";
import walk from "ignore-walk";
import tar from "tar";

import { findFileUpwards } from "cli/utils";
import { ApiError, CircuitsService, CircuitStatus, OpenAPI } from "lib/api";
import { logger } from "lib/logging";

export const deployCommand = new Command()
  .name("deploy")
  .description("Deploy the current Sindri project.")
  .option("-t, --tag <tag...>", "Tag to apply to the circuit.", ["latest"])
  .option("-u, --untagged", "Discard the current circuit after compiling.")
  .argument("[directory]", "The location of the Sindri project to deploy.", ".")
  .action(async (directory, { tag: tags, untagged }) => {
    // Validate the tags and "untagged" option.
    if (untagged) {
      if (tags.length !== 1 || tags[0] !== "latest") {
        logger.error(
          "You cannot use both the `--tag` and `--untagged` options together.",
        );
        return process.exit(1);
      }
    } else {
      for (const tag of tags) {
        if (!/^[-a-zA-Z0-9_]+$/.test(tag)) {
          logger.error(
            `"${tag}" is not a valid tag. Tags may only contain alphanumeric characters, ` +
              "underscores, and hyphens.",
          );
          return process.exit(1);
        }
      }
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
    process.chdir(rootDirectory);

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
    if (!("name" in sindriJson)) {
      logger.error('No "name" field found in "sindri.json". Aborting.');
      return process.exit(1);
    }
    const circuitName = sindriJson.name;

    // Check that the API client is authorized.
    if (!OpenAPI.TOKEN || !OpenAPI.BASE) {
      logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // Create a project tarball and prepare the form data for upload.
    const files = walk
      .sync({
        follow: true,
        ignoreFiles: [".sindriignore"],
        path: ".",
      })
      .filter(
        (file) =>
          // Always exclude `.git` subdirectories.
          !/(^|\/)\.git(\/|$)/.test(file),
      );
    // Always include the `sindri.json` file.
    const sindriJsonFilename = path.basename(sindriJsonPath);
    if (!files.includes(sindriJsonFilename)) {
      files.push(sindriJsonFilename);
    }
    const formData = new FormData();
    const tarballFilename = `${circuitName}.tar.gz`;
    logger.info(
      `Creating "${tarballFilename}" package with ${files.length} files.`,
    );
    formData.append(
      "files",
      new Blob([
        tar
          .c(
            {
              gzip: true,
              onwarn: (code: string, message: string) => {
                logger.warn(`While creating tarball: ${code} - ${message}`);
              },
              prefix: `${circuitName}/`,
              sync: true,
            },
            files,
          )
          // @ts-expect-error - @types/tar doesn't handle the `sync` option correctly.
          .read(),
      ]),
      tarballFilename,
    );

    // Attach the tags to the form data.
    if (untagged) {
      formData.append("tags", "");
    } else {
      for (const tag of tags) {
        formData.append("tags", tag);
      }
    }

    // Upload the tarball.
    let circuitId: string | undefined;
    try {
      logger.info("Circuit compilation initiated.");
      const response = await CircuitsService.circuitCreate(formData);
      circuitId = response.circuit_id;
      logger.debug("/api/v1/circuit/create/ response:");
      logger.debug(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logger.error(
          "Your credentials are invalid. Please log in again with `sindri login`.",
        );
      } else {
        logger.fatal("An unknown error occurred.");
        logger.error(error);
        return process.exit(1);
      }
    }
    if (!circuitId) {
      logger.error("No circuit ID was returned from the API. Aborting.");
      return process.exit(1);
    }

    // Poll for circuit compilation to complete.
    const startTime = Date.now();
    let previousStatus: CircuitStatus | undefined;
    while (true) {
      try {
        logger.debug("Polling for circuit compilation status.");
        const response = await CircuitsService.circuitDetail(circuitId, false);

        // Only log this when the status changes because it's noisy.
        if (previousStatus !== response.status) {
          previousStatus = response.status;
          logger.debug(`/api/v1/circuit/${circuitId}/detail/ response:`);
          logger.debug(response);
        }

        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        if (response.status === "Ready") {
          logger.info(
            `Circuit compiled successfully after ${elapsedSeconds} seconds.`,
          );
          break;
        } else if (response.status === "Failed") {
          logger.error(
            `Circuit compilation failed after ${elapsedSeconds} seconds: ` +
              (response.error ?? "Unknown error."),
          );
          return process.exit(1);
        } else if (response.status === "Queued") {
          logger.debug("Circuit compilation is queued.");
        } else if (response.status === "In Progress") {
          logger.debug("Circuit compilation is in progress.");
        }
      } catch (error) {
        logger.fatal(
          "An unknown error occurred while polling for compilation to finish.",
        );
        logger.error(error);
        return process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
