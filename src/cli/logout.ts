import { Command } from "@commander-js/extra-typings";
import { confirm } from "@inquirer/prompts";

import sindri from "lib";
import { Config } from "lib/config";

export const logoutCommand = new Command()
  .name("logout")
  .description("Remove the current client authorization credentials.")
  .action(async () => {
    // Check whether we're currently authenticated.
    const config = new Config();
    const auth = config.auth;
    if (!auth) {
      sindri.logger.error("You must log in first with `sindri login`.");
      return;
    }

    // Optionally revoke the current key.
    const revokeKey = await confirm({
      message: `Would you like to also revoke the "${auth.apiKeyName}" API key? (recommended)`,
      default: true,
    });
    if (revokeKey) {
      try {
        await sindri._client.authorization.apikeyDelete(auth.apiKeyId);
        sindri.logger.info(`Successfully revoked "${auth.apiKeyName}" key.`);
      } catch (error) {
        sindri.logger.warn(
          `Error revoking "${auth.apiKeyName}" key, proceeding to clear credentials anyway.`,
        );
        sindri.logger.error(error);
      }
    } else {
      sindri.logger.warn("Skipping revocation of existing key.");
    }

    // Clear the existing credentials.
    config.update({ auth: null });
    sindri.logger.info("You have successfully logged out.");
  });
