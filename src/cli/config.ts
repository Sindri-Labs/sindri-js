import { Command } from "@commander-js/extra-typings";

import { Config } from "lib/config";
import { print } from "lib/logging";

export const configListCommand = new Command()
  .name("list")
  .description("Show the current config.")
  .action(async () => {
    const config = new Config();
    print(config.config);
  });

export const configCommand = new Command()
  .name("config")
  .description("Commands related to configuration and config files.")
  .addCommand(configListCommand);
