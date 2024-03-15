import assert from "assert";
import path from "path";
import process from "process";

import { Command } from "@commander-js/extra-typings";

import {
  checkDockerAvailability,
  execDockerCommand,
  findFileUpwards,
  getDockerImageTags,
} from "cli/utils";
import sindri from "lib";
import { print } from "lib/logging";

// Shared globals between the different subcommands.
let listTags: boolean;
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
    if (listTags) return; // Don't run the command if we're just listing tags.

    try {
      const code = await execDockerCommand("circomspect", args, {
        logger: sindri.logger,
        rootDirectory,
        tag,
        tty: true,
      });
      process.exit(code);
    } catch (error) {
      sindri.logger.error("Failed to run the circomspect command.");
      sindri.logger.debug(error);
      return process.exit(1);
    }
  });

const nargoCommand = new Command()
  .name("nargo")
  .description("Aztec Lab's Noir compiler and package manager.")
  .helpOption(false)
  .addHelpCommand(false)
  .allowUnknownOption()
  .passThroughOptions()
  .argument("[args...]", "Arguments to pass to the tool.")
  .action(async (args) => {
    if (listTags) return; // Don't run the command if we're just listing tags.

    try {
      const code = await execDockerCommand("nargo", args, {
        logger: sindri.logger,
        rootDirectory,
        tag,
        tty: true,
      });
      process.exit(code);
    } catch (error) {
      sindri.logger.error("Failed to run the nargo command.");
      sindri.logger.debug(error);
      return process.exit(1);
    }
  });

export const execCommand = new Command()
  .name("exec")
  .alias("x")
  .description(
    "Run a ZKP tool in your project root inside of an optimized docker container.",
  )
  .passThroughOptions()
  .option(
    "-l, --list-tags",
    "List the available docker image tags for a given tool.",
  )
  .option(
    "-t, --tag <tag>",
    "The version tag of the docker image to use.",
    "auto",
  )
  .addCommand(circomspectCommand)
  .addCommand(nargoCommand)
  .hook("preAction", async (command) => {
    // Store the options in globals for subcommands to access them.
    const opts = command.opts();
    listTags = !!opts.listTags;
    tag = opts.tag;

    // Handle the `--list-tags` option.
    if (listTags) {
      const repository = command.args[0];
      assert(
        repository,
        "The preAction hook should only run if there's a subcommand.",
      );
      try {
        const tags = await getDockerImageTags(repository);
        tags.forEach((tag) => print(tag));
      } catch (error) {
        sindri.logger.fatal("Error listing available docker image tags.");
        sindri.logger.error(error);
        return process.exit(1);
      }
      return process.exit(0);
    }

    // Find the project root.
    const cwd = process.cwd();
    const sindriJsonPath = findFileUpwards(/^sindri.json$/i, cwd);
    if (sindriJsonPath) {
      rootDirectory = path.dirname(sindriJsonPath);
    } else {
      rootDirectory = cwd;
      sindri.logger.warn(
        `No "sindri.json" file was found in or above "${cwd}", ` +
          "using the current directory as the project root.",
      );
    }
    rootDirectory = path.normalize(path.resolve(rootDirectory));

    // Check that docker is installed.
    if (!(await checkDockerAvailability(sindri.logger))) {
      sindri.logger.fatal(
        "Docker is either not installed or the daemon isn't currently running, but it is " +
          'required by "sindri exec".\nPlease install Docker by following the instructions at: ' +
          "https://docs.docker.com/get-docker/",
      );
      process.exit(1);
    }
  });
