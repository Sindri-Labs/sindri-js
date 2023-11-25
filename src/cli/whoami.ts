import process from "process";

import { Command } from "@commander-js/extra-typings";

import { Config } from "cli/config";
import { logger, print } from "cli/logging";

export const whoamiCommand = new Command()
  .name("whoami")
  .description("Display the currently authorized team name.")
  .action(async () => {
    // Authorize the API client.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      logger.warn("You must login first with `sindri login`.");
      return process.exit(1);
    }

    // TODO: Use the new "team-me" endpoint to test authentication and fetch the current team.
    // This should be deployed soon, and we'll update this method then. For now, we just rely on
    // whatever the team slug was when we logged in last.
    print(auth.teamSlug);
  });
