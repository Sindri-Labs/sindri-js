import os from "os";
import process from "process";

import { Command } from "@commander-js/extra-typings";
import {
  confirm,
  input,
  password as passwordInput,
  select,
} from "@inquirer/prompts";

import { Config } from "cli/config";
import { logger } from "cli/logging";
import {
  ApiError,
  AuthorizationService,
  InternalService,
  OpenAPI,
  TokenService,
} from "lib/api";

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
        await InternalService.teamMe();
        authenticated = true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logger.warn(
            "Existing credentials found, but invalid. Please continue logging in to update them.",
          );
        } else {
          logger.fatal("An unknown error occurred.");
          logger.error(error);
          return;
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
      OpenAPI.TOKEN = tokenResult.access;

      // Fetch their teams and have the user select one.
      const userResult = await InternalService.userMeWithJwtAuth();
      const teamId = await select({
        message: "Select a Team:",
        choices: userResult.teams.map(({ id, slug }) => ({
          name: slug,
          value: id,
        })),
      });
      const team = userResult.teams.find((team) => team.id === teamId);
      if (!team) {
        throw new Error("No team selected.");
      }

      // Generate an API key.
      const result = await AuthorizationService.apikeyGenerate({
        username,
        password,
        name,
      });
      const apiKey = result.api_key;
      if (!apiKey) {
        throw new Error("Error generating API key.");
      }

      // Store the new auth information.
      config.update({ auth: { apiKey, baseUrl, teamId, teamSlug: team.slug } });
      logger.info(
        "You have successfully authorized the client with your Sindri account.",
      );
    } catch (error) {
      logger.fatal("An irrecoverable error occurred.");
      logger.error(error);
      process.exit(1);
    }
  });
