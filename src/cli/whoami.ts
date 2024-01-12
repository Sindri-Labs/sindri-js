import process from "process";

import { Command } from "@commander-js/extra-typings";

import { logger, print } from "cli/logging";
import { ApiError, InternalService } from "lib/api";
import { Config } from "lib/config";

export const whoamiCommand = new Command()
  .name("whoami")
  .description("Display the currently authorized organization name.")
  .action(async () => {
    // Authorize the API client.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    try {
      const response = await InternalService.teamMe();
      logger.debug("/api/v1/team/me/ response:");
      logger.debug(response);
      print(response.team.slug);
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
  });
