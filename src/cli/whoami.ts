import axios from "axios";
import chalk from "chalk";
import { Command } from "@commander-js/extra-typings";

import { config } from "cli/config";

export const whoamiCommand = new Command()
  .name("whoami")
  .description("Display the currently authorized team name.")
  .action(async () => {
    // Authorize the API client.
    const auth = config.auth;
    if (!auth) {
      console.error(chalk.red("You must login first with `sindri login`."));
      return;
    }
    axios.defaults.headers.common = {
      Authorization: `Bearer ${auth.apiKey}`,
    };

    // TODO: Use the new "team-me" endpoint to test authentication and fetch the current team.
    // This should be deployed soon, and we'll update this method then. For now, we just rely on
    // whatever the team slug was when we logged in last.
    console.log(auth.teamSlug);
  });
