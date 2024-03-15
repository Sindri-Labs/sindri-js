import os from "os";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import {
  confirm,
  input,
  password as passwordInput,
  select,
} from "@inquirer/prompts";

import sindri from "lib";
import { ApiError, type TeamMeResponse } from "lib/api";
import { Config } from "lib/config";

export const loginCommand = new Command()
  .name("login")
  .description("Authorize the client.")
  .option(
    "-u, --base-url <URL>",
    "The base URL for the Sindri API. Mainly useful for development.",
    "https://sindri.app",
  )
  .action(async ({ baseUrl }) => {
    const config = new Config();
    // Check if they're already authenticated, and prompt for confirmation if so.
    const auth = config.auth;
    if (!auth) {
      let teamMeResponse: TeamMeResponse | undefined;
      try {
        teamMeResponse = await sindri._client.internal.teamMe();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          sindri.logger.warn(
            "Existing credentials found, but invalid. Please continue logging in to update them.",
          );
        } else {
          sindri.logger.fatal("An unknown error occurred.");
          sindri.logger.error(error);
          return process.exit(1);
        }
      }

      if (teamMeResponse) {
        const proceed = await confirm({
          message:
            `You are already logged in as ${teamMeResponse.team.slug} on ${sindri.baseUrl}, ` +
            "are you sure you want to proceed?",
          default: false,
        });
        if (!proceed) {
          sindri.logger.info("Aborting.");
          return;
        }
      }
    }

    // Collect details for generating an API key.
    const username = await input({ message: "Username:" });
    const password = await passwordInput({ mask: true, message: "Password:" });
    const name = await input({
      default: `${os.hostname()}-sdk`,
      message: "New API Key Name:",
    });

    // Generate an API key for one of their teams.
    try {
      // Generate a JWT token to authenticate the user.
      sindri._clientConfig.BASE = baseUrl;
      const tokenResult =
        await sindri._client.token.fd3Aaa7BControllerObtainToken({
          username,
          password,
        });
      sindri._clientConfig.TOKEN = tokenResult.access;

      // Fetch their teams and have the user select one.
      const userResult = await sindri._client.internal.userMeWithJwtAuth();
      const teamId = await select({
        message: "Select a Organization:",
        choices: userResult.teams.map(({ id, slug }) => ({
          name: slug,
          value: id,
        })),
      });
      const team = userResult.teams.find((team) => team.id === teamId);
      if (!team) {
        throw new Error("No organization selected.");
      }

      // Generate an API key.
      sindri._clientConfig.HEADERS = {
        ...sindri._clientConfig.HEADERS,
        "Sindri-Team-Id": `${teamId}`,
      };
      const apiKeyResult = await sindri._client.authorization.apikeyGenerate({
        username,
        password,
        name,
      });
      const apiKey = apiKeyResult.api_key;
      const apiKeyId = apiKeyResult.id;
      const apiKeyName = apiKeyResult.name;
      if (!apiKey || !apiKeyId || !apiKeyName) {
        throw new Error("Error generating API key.");
      }

      // Store the new auth information.
      config.update({
        auth: {
          apiKey,
          apiKeyId,
          apiKeyName,
          baseUrl,
          teamId,
          teamSlug: team.slug,
        },
      });
      sindri.logger.info(
        "You have successfully authorized the client with your Sindri account.",
      );
    } catch (error) {
      sindri.logger.fatal("An irrecoverable error occurred.");
      sindri.logger.error(error);
      process.exit(1);
    }
  });
