import os from "os";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import {
  confirm,
  input,
  password as passwordInput,
  select,
} from "@inquirer/prompts";

import {
  ApiError,
  AuthorizationService,
  InternalService,
  OpenAPI,
  TokenService,
} from "lib/api";
import { Config } from "lib/config";
import { logger } from "lib/logging";

export const loginCommand = new Command()
  .name("login")
  .description("Authorize the client.")
  .option(
    "-u, --base-url <URL>",
    "The base URL for the Sindri API. Mainly useful for development.",
    OpenAPI.BASE,
  )
  .action(async ({ baseUrl }) => {
    // Check if they're already authenticated, and prompt for confirmation if so.
    const config = new Config();
    const auth = config.auth;
    if (auth) {
      let authenticated: boolean = false;
      try {
        const teamMeResult = await InternalService.teamMe();
        logger.debug("/api/v1/team/me/ response:");
        logger.debug(teamMeResult);
        authenticated = true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logger.warn(
            "Existing credentials found, but invalid. Please continue logging in to update them.",
          );
        } else {
          logger.fatal("An unknown error occurred.");
          logger.error(error);
          return process.exit(1);
        }
      }

      if (authenticated) {
        const proceed = await confirm({
          message:
            `You are already logged in as ${auth.teamSlug} on ${auth.baseUrl}, ` +
            "are you sure you want to proceed?",
          default: false,
        });
        if (!proceed) {
          logger.info("Aborting.");
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
      OpenAPI.BASE = baseUrl;
      const tokenResult = await TokenService.bf740E1AControllerObtainToken({
        username,
        password,
      });
      logger.debug("/api/token/ response:");
      logger.debug(tokenResult);
      OpenAPI.TOKEN = tokenResult.access;

      // Fetch their teams and have the user select one.
      const userResult = await InternalService.userMeWithJwtAuth();
      logger.debug("/api/v1/user/me/ response:");
      logger.debug(userResult);
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
      OpenAPI.HEADERS = { "Sindri-Team-Id": `${teamId}` };
      const apiKeyResult = await AuthorizationService.apikeyGenerate({
        username,
        password,
        name,
      });
      logger.debug("/api/apikey/generate/ response:");
      logger.debug(apiKeyResult);
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
      logger.info(
        "You have successfully authorized the client with your Sindri account.",
      );
    } catch (error) {
      logger.fatal("An irrecoverable error occurred.");
      logger.error(error);
      process.exit(1);
    }
  });
