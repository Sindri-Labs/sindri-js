import fs from "fs";
import path from "path";

import { Command } from "@commander-js/extra-typings";
import envPaths from "env-paths";
import { cloneDeep, merge } from "lodash";
import { z } from "zod";

import { logger, print } from "cli/logging";
import { OpenAPI } from "lib/api";

const paths = envPaths("sindri", {
  suffix: "",
});
const configPath = path.join(paths.config, "sindri.conf.json");

const ConfigSchema = z.object({
  auth: z
    .nullable(
      z.object({
        apiKey: z.string(),
        apiKeyId: z.string(),
        apiKeyName: z.string(),
        baseUrl: z.string().url(),
        teamId: z.number(),
        teamSlug: z.string(),
      }),
    )
    .default(null),
});

type ConfigSchema = z.infer<typeof ConfigSchema>;

const defaultConfig: ConfigSchema = ConfigSchema.parse({});

const loadConfig = (): ConfigSchema => {
  if (fs.existsSync(configPath)) {
    logger.debug(`Loading config from "${configPath}".`);
    try {
      const configFileContents: string = fs.readFileSync(configPath, {
        encoding: "utf-8",
      });
      const loadedConfig = ConfigSchema.parse(JSON.parse(configFileContents));
      logger.debug("Config loaded successfully.");
      return loadedConfig;
    } catch (error) {
      logger.warn(
        `The config schema in "${configPath}" is invalid and will not be used.\n` +
          `To remove it and start fresh, run:\n    rm ${configPath}`,
      );
      logger.debug(error);
    }
  }
  logger.debug(
    `Config file "${configPath}" does not exist, initializing default config.`,
  );
  return cloneDeep(defaultConfig);
};

export class Config {
  protected _config!: ConfigSchema;
  protected static instance: Config;

  constructor() {
    if (!Config.instance) {
      this._config = loadConfig();
      Config.instance = this;
      // Prepare API the client with the loaded credentials.
      if (this._config.auth) {
        OpenAPI.BASE = this._config.auth.baseUrl;
        OpenAPI.TOKEN = this._config.auth.apiKey;
      }
    }
    return Config.instance;
  }

  get auth(): ConfigSchema["auth"] {
    return cloneDeep(this._config.auth);
  }

  get config(): ConfigSchema {
    return cloneDeep(this._config);
  }

  update(configData: Partial<ConfigSchema>) {
    // Merge and validate the configs.
    logger.debug("Merging in config update:");
    logger.debug(configData);
    const newConfig: ConfigSchema = cloneDeep(this._config);
    merge(newConfig, configData);
    this._config = ConfigSchema.parse(newConfig);

    // Create the directory if it doesn't exist.
    const directory = path.dirname(configPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write out the new config.
    logger.debug(`Writing merged config to "${configPath}":`, this._config);
    fs.writeFileSync(configPath, JSON.stringify(this._config, null, 2), {
      encoding: "utf-8",
    });
  }
}

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
