import { Command } from "@commander-js/extra-typings";
import { confirm } from "@inquirer/prompts";

import { AuthorizationService } from "lib/api";
import { Config } from "lib/config";
import { logger } from "lib/logging";

export const logoutCommand = new Command()
  .name("logout")
  .description("Remove the current client authorization credentials.")
  .action(async () => {
    // Check whether we're currently authenticated.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      logger.error("You must log in first with `sindri login`.");
      return;
    }

    // Optionally revoke the current key.
    const revokeKey = await confirm({
      message: `Would you like to also revoke the "${auth.apiKeyName}" API key? (recommended)`,
      default: true,
    });
    if (revokeKey) {
      try {
        const response = await AuthorizationService.apikeyDelete(auth.apiKeyId);
        logger.info(`Successfully revoked "${auth.apiKeyName}" key.`);
        logger.debug(`/api/v1/apikey/${auth.apiKeyId}/delete/ response:`);
        logger.debug(response);
      } catch (error) {
        logger.warn(
          `Error revoking "${auth.apiKeyName}" key, proceeding to clear credentials anyway.`,
        );
        logger.error(error);
      }
    } else {
      logger.warn("Skipping revocation of existing key.");
    }

    // Clear the existing credentials.
    config.update({ auth: null });
    logger.info("You have successfully logged out.");
  });
