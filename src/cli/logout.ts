import { Command } from "@commander-js/extra-typings";

import { Config } from "cli/config";
import { logger } from "cli/logging";

export const logoutCommand = new Command()
  .name("logout")
  .description("Remove the current client authorization credentials.")
  .action(async () => {
    // Authorize the API client.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      logger.error("You must log in first with `sindri login`.");
      return;
    }

    config.update({ auth: null });
    logger.info("You have successfully logged out.");
  });
