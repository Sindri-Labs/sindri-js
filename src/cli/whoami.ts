import process from "process";

import { Command } from "@commander-js/extra-typings";

import sindri from "lib";
import { ApiError } from "lib/api";
import { print } from "lib/logging";

export const whoamiCommand = new Command()
  .name("whoami")
  .description("Display the currently authorized organization name.")
  .action(async () => {
    // Check that the API client is authorized.
    if (!sindri.apiKey || !sindri.baseUrl) {
      sindri.logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    try {
      const response = await sindri._client.internal.teamMe();
      print(response.team.slug);
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
  });
