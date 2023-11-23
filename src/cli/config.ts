import fs from "fs";
import path from "path";

import chalk from "chalk";
import envPaths from "env-paths";
import { cloneDeep, merge } from "lodash";
import { z } from "zod";

const paths = envPaths("sindri", {
  suffix: "",
});
const configPath = path.join(paths.config, "sindri.conf.json");
console.log(configPath);

const ConfigSchema = z.object({
  auth: z
    .nullable(
      z.object({
        apiKey: z.string(),
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
    try {
      const configFileContents: string = fs.readFileSync(configPath, {
        encoding: "utf-8",
      });
      return ConfigSchema.parse(JSON.parse(configFileContents));
    } catch {
      console.warn(
        chalk.yellow(
          `The config schema in "${configPath}" is invalid and will not be used.\n` +
            `To remove it and start fresh, run:\n    rm ${configPath}`,
        ),
      );
    }
  }
  return cloneDeep(defaultConfig);
};

class Config {
  protected _config: ConfigSchema;

  constructor() {
    this._config = loadConfig();
  }

  get auth(): ConfigSchema["auth"] {
    return cloneDeep(this._config.auth);
  }

  update(configData: Partial<ConfigSchema>) {
    // Merge and validate the configs.
    const newConfig: ConfigSchema = cloneDeep(this._config);
    merge(newConfig, configData);
    this._config = ConfigSchema.parse(newConfig);

    // Create the directory if it doesn't exist.
    const directory = path.dirname(configPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // Write out the new config.
    fs.writeFileSync(configPath, JSON.stringify(this._config, null, 2), {
      encoding: "utf-8",
    });
  }
}

export const config = new Config();
