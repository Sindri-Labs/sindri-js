import chalk from "chalk";
import { Command } from "@commander-js/extra-typings";

import { config } from "cli/config";

export const logoutCommand = new Command()
  .name("logout")
  .description("Remove the current client authorization credentials.")
  .action(async () => {
    // Authorize the API client.
    const auth = config.auth;
    if (!auth) {
      console.error(chalk.red("You must log in first with `sindri login`."));
      return;
    }

    config.update({ auth: null });
    console.log(chalk.green("You have successfully logged out."));
  });
