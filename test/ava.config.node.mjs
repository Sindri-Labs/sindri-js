import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import baseConfig from "./ava.config.base.mjs";

// Use the node tsconfig import paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.node.json");

export default {
  ...baseConfig,
};
