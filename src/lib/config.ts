import fs from "fs";
import path from "path";

import envPaths from "env-paths";
import _ from "lodash";
import { z } from "zod";

import { type Logger } from "lib/logging";

const getConfigPath = (): string => {
  const paths = envPaths("sindri", {
    suffix: "",
  });
  return path.join(paths.config, "sindri.conf.json");
};

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

export const loadConfig = (logger?: Logger): ConfigSchema => {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    logger?.debug(`Loading config from "${configPath}".`);
    try {
      const configFileContents: string = fs.readFileSync(configPath, {
        encoding: "utf-8",
      });
      const loadedConfig = ConfigSchema.parse(JSON.parse(configFileContents));
      logger?.debug("Config loaded successfully.");
      return loadedConfig;
    } catch (error) {
      logger?.warn(
        `The config schema in "${configPath}" is invalid and will not be used.\n` +
          `To remove it and start fresh, run:\n    rm ${configPath}`,
      );
      logger?.debug(error);
    }
  }
  logger?.debug(
    `Config file "${configPath}" does not exist, initializing default config.`,
  );
  return _.cloneDeep(defaultConfig);
};

export class Config {
  protected _config!: ConfigSchema;
  protected readonly logger: Logger | undefined;

  constructor(logger?: Logger) {
    this.logger = logger;
    this.reload();
  }

  get auth(): ConfigSchema["auth"] {
    return _.cloneDeep(this._config.auth);
  }

  get config(): ConfigSchema {
    return _.cloneDeep(this._config);
  }

  reload() {
    this._config = loadConfig(this.logger);
  }

  update(configData: Partial<ConfigSchema>) {
    // Merge and validate the configs.
    this.logger?.debug("Merging in config update:");
    this.logger?.debug(configData);
    const newConfig: ConfigSchema = _.cloneDeep(this._config);
    _.merge(newConfig, configData);
    this._config = ConfigSchema.parse(newConfig);

    // Create the directory if it doesn't exist.
    const configPath = getConfigPath();
    const directory = path.dirname(configPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write out the new config.
    this.logger?.debug(
      `Writing merged config to "${configPath}":`,
      this._config,
    );
    fs.writeFileSync(configPath, JSON.stringify(this._config, null, 2), {
      encoding: "utf-8",
    });
  }
}
