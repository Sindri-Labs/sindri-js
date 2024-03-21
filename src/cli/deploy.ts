import { Blob } from "buffer";
import { existsSync, readFileSync } from "fs";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import { FormData } from "formdata-node";
import walk from "ignore-walk";
import tar from "tar";

import { findFileUpwards } from "cli/utils";
import sindri from "lib";
import { ApiError } from "lib/api";

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
        sindri.logger.error(
          "You cannot use both the `--tag` and `--untagged` options together.",
        );
        return process.exit(1);
      }
    } else {
      for (const tag of tags) {
        if (!/^[-a-zA-Z0-9_.]+$/.test(tag)) {
          sindri.logger.error(
            `"${tag}" is not a valid tag. Tags may only contain alphanumeric characters, ` +
              "underscores, hyphens, and periods.",
          );
          return process.exit(1);
        }
      }
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
    process.chdir(rootDirectory);

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
    if (!("name" in sindriJson)) {
      sindri.logger.error('No "name" field found in "sindri.json". Aborting.');
      return process.exit(1);
    }
    const circuitName = sindriJson.name;

    // Check that the API client is authorized.
    if (!sindri.apiKey || !sindri.baseUrl) {
      sindri.logger.warn("You must login first with `sindri login`.");
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
    sindri.logger.info(
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
                sindri.logger.warn(
                  `While creating tarball: ${code} - ${message}`,
                );
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
      sindri.logger.info("Circuit compilation initiated.");
      const response = await sindri._client.circuits.circuitCreate(formData);
      circuitId = response.circuit_id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sindri.logger.error(
          "Your credentials are invalid. Please log in again with `sindri login`.",
        );
      } else {
        sindri.logger.fatal("An unknown error occurred.");
        sindri.logger.error(error);
        return process.exit(1);
      }
    }
    if (!circuitId) {
      sindri.logger.error("No circuit ID was returned from the API. Aborting.");
      return process.exit(1);
    }

    // Poll for circuit compilation to complete.
    const startTime = Date.now();
    while (true) {
      try {
        sindri.logger.debug("Polling for circuit compilation status.");
        const response = await sindri._client.circuits.circuitDetail(
          circuitId,
          false,
        );

        const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
        if (response.status === "Ready") {
          sindri.logger.info(
            `Circuit compiled successfully after ${elapsedSeconds} seconds.`,
          );
          break;
        } else if (response.status === "Failed") {
          sindri.logger.error(
            `Circuit compilation failed after ${elapsedSeconds} seconds: ` +
              (response.error ?? "Unknown error."),
          );
          return process.exit(1);
        } else if (response.status === "Queued") {
          sindri.logger.debug("Circuit compilation is queued.");
        } else if (response.status === "In Progress") {
          sindri.logger.debug("Circuit compilation is in progress.");
        }
      } catch (error) {
        sindri.logger.fatal(
          "An unknown error occurred while polling for compilation to finish.",
        );
        sindri.logger.error(error);
        return process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
