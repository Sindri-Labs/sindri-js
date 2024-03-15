import { Command } from "@commander-js/extra-typings";

import { print } from "lib/logging";
import sindri from "lib";

export const configListCommand = new Command()
  .name("list")
  .description("Show the current config.")
  .action(async () => {
    // Reload the config because the log level was `silent` when the config was initially loaded.
    sindri._config!.reload();
    print(sindri._config!.config);
  });

export const configCommand = new Command()
  .name("config")
  .description("Commands related to configuration and config files.")
  .addCommand(configListCommand);
