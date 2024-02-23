// import assert from "assert";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import Docker from "dockerode";

import sindri from "lib";
import { findFileUpwards } from "cli/utils";

// Shared globals between the different subcommands.
let docker: Docker;
let rootDirectory: string;

const circomspectCommand = new Command()
  .name("circomspect")
  .description(
    "Trail of Bit's Circomspect static analysis tool for Circom circuits.",
  )
  .helpOption(false)
  .addHelpCommand(false)
  .allowUnknownOption()
  .passThroughOptions()
  .argument("[args...]", "Arguments to pass to the tool.")
  .action(async (args) => {
    const image = "sindrilabs/circomspect:latest";

    // Pull the circomspect image.
    sindri.logger.debug(`Pulling the "${image}" image.`);
    try {
      await new Promise((resolve, reject) => {
        docker.pull(
          image,
          (error: Error | null, stream: NodeJS.ReadableStream) => {
            if (error) {
              reject(error);
            } else {
              docker.modem.followProgress(stream, (error, result) =>
                error ? reject(error) : resolve(result),
              );
            }
          },
        );
      });
    } catch (error) {
      sindri.logger.error(`Failed to pull the "${image}" image.`);
      sindri.logger.error(error);
      return process.exit(1);
    }

    // Run circomspect with the project root mounted and pipe the output to stdout.
    let status: number;
    try {
      const data: { StatusCode: number } = await new Promise(
        (resolve, reject) => {
          docker.run(
            image,
            args,
            process.stdout,
            {
              HostConfig: {
                Binds: [`${rootDirectory}:/sindri`],
              },
            },
            (error, data) => {
              if (error) {
                reject(error);
              } else {
                resolve(data);
              }
            },
          );
        },
      );
      status = data.StatusCode;
    } catch (error) {
      sindri.logger.error("Failed to run the circomspect command.");
      sindri.logger.error(error);
      return process.exit(1);
    }
    process.exit(status);
  });

export const execCommand = new Command()
  .name("exec")
  .alias("x")
  .description(
    "Run a ZK tool in your project root inside of an optimized docker container.",
  )
  .passThroughOptions()
  .addCommand(circomspectCommand)
  .hook("preAction", async () => {
    // Find the project root.
    const cwd = process.cwd();
    const sindriJsonPath = findFileUpwards(/^sindri.json$/i, cwd);
    if (sindriJsonPath) {
      rootDirectory = path.dirname(sindriJsonPath);
    } else {
      rootDirectory = cwd;
      sindri.logger.warn(
        `No "sindri.json" file was found in or above "${cwd}", ` +
          `using the current directory as the project root.`,
      );
    }

    // Check that docker is installed.
    docker = new Docker();
    try {
      await docker.ping();
    } catch (error) {
      sindri.logger.error(
        'Docker is not installed or running, but is requiring for "sindri exec".',
      );
      sindri.logger.error(error);
      process.exit(1);
    }
  });
