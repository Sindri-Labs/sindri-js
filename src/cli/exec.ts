// import assert from "assert";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import Docker from "dockerode";

import sindri from "lib";
import { execDockerCommand, findFileUpwards } from "cli/utils";

// Shared globals between the different subcommands.
let docker: Docker;
let rootDirectory: string;
let tag: string;

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
    try {
      const code = await execDockerCommand("circomspect", args, {
        docker,
        logger: sindri.logger,
        rootDirectory,
        stream: process.stdout,
        tag,
      });
      process.exit(code);
    } catch (error) {
      sindri.logger.error("Failed to run the circomspect command.");
      sindri.logger.debug(error);
      return process.exit(1);
    }
  });

export const execCommand = new Command()
  .name("exec")
  .alias("x")
  .description(
    "Run a ZK tool in your project root inside of an optimized docker container.",
  )
  .passThroughOptions()
  .option(
    "-t, --tag <tag>",
    "The version tag of the docker image to use.",
    "auto",
  )
  .addCommand(circomspectCommand)
  .hook("preAction", async ({ tag: tagOption }) => {
    tag = tagOption;

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
    rootDirectory = path.normalize(path.resolve(rootDirectory));

    // Check that docker is installed.
    docker = new Docker();
    try {
      await docker.ping();
    } catch (error) {
      sindri.logger.error(
        "Docker is either not installed or the daemon isn't currently running, but it is " +
          'required by "sindri exec". Please install Docker by following the instructions at: ' +
          "https://docs.docker.com/get-docker/",
      );
      sindri.logger.debug(error);
      process.exit(1);
    }
  });
