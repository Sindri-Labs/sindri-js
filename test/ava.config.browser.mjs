import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import baseConfig from "./ava.config.base.mjs";

// Use the browser tsconfig import paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.browser.json");

export default {
  ...baseConfig,
  files: ["test/browser/**/*.test.ts"],
};
