import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { Command } from "@commander-js/extra-typings";
import { confirm } from "@inquirer/prompts";

import { findFileUpwards } from "cli/utils";
import sindri from "lib";
import { ApiError } from "lib/api";

async function deleteProject(projectIdentifier: string): Promise<void> {
  try {
    await sindri._client.internal.projectDelete(projectIdentifier);
    sindri.logger.debug(`Deleted project "${projectIdentifier}".`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sindri.logger.error(
        "Your credentials are invalid. Please log in again with `sindri login`.",
      );
    } else if (error instanceof ApiError && error.status === 404) {
      sindri.logger.error(`The project "${projectIdentifier}" does not exist.`);
    } else {
      sindri.logger.fatal("An unknown error occurred.");
      sindri.logger.error(error);
    }
    return process.exit(1);
  }
}

function findProjectName(directory: string): string {
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
  if (!("name" in sindriJson) || typeof sindriJson.name !== "string") {
    sindri.logger.error('No "name" field found in "sindri.json". Aborting.');
    return process.exit(1);
  }
  return sindriJson.name;
}

async function getSomeProjectNames(teamName: string): Promise<string[]> {
  try {
    const projects = await sindri._client.internal.projectListPaginated({
      team_name: teamName,
    });
    return projects.items.map(({ name }) => name);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sindri.logger.error(
        "Your credentials are invalid. Please log in again with `sindri login`.",
      );
    } else {
      sindri.logger.fatal("An unknown error occurred.");
      sindri.logger.error(error);
    }
    return process.exit(1);
  }
}

async function getTeamName(): Promise<string> {
  try {
    const response = await sindri._client.internal.teamMe();
    return response.team.slug;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      sindri.logger.error(
        "Your credentials are invalid. Please log in again with `sindri login`.",
      );
    } else {
      sindri.logger.fatal("An unknown error occurred.");
      sindri.logger.error(error);
    }
    return process.exit(1);
  }
}

const projectDeleteCommand = new Command()
  .name("delete")
  .description("Delete a project and all associated builds and proofs.")
  .option(
    "-a, --all",
    "Delete *all* projects. Overrides the `--name` and directory options.",
  )
  .option("-f, --force", "Skip the confirmation prompt.")
  .option(
    "-n, --name <name>",
    "The name of the project to delete. Overrides the directory option.",
  )
  .argument("[directory]", "The location of the Sindri project to delete.", ".")
  .action(async (directory, { all, force, name }) => {
    // Check that the API client is authorized.
    if (!sindri.apiKey || !sindri.baseUrl) {
      sindri.logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // Ask the user for confirmation.
    if (!force) {
      const userConfirmed = await confirm({
        message:
          "This will permanently delete the project(s) and any associated proofs. Proceed?",
        default: true,
      });
      if (!userConfirmed) {
        sindri.logger.warn("Aborting. No projects were deleted.");
        return;
      }
    }

    // Perform the deletion.
    let deletedCount = 0;
    if (!all) {
      name = name || findProjectName(directory);
      await deleteProject(name);
    } else {
      const teamName = await getTeamName();
      while (true) {
        const projectNames = await getSomeProjectNames(teamName);
        if (projectNames.length === 0) {
          break;
        }

        // Iterate through project names.
        for (const projectName of projectNames) {
          await deleteProject(projectName);
          deletedCount++;
        }
      }
    }

    sindri.logger.info(`Successfully deleted ${deletedCount} projects.`);
  });

export const projectCommand = new Command()
  .name("project")
  .description("Commands related to managing projects.")
  .addCommand(projectDeleteCommand);
