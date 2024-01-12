import path from "path";
import process from "process";
import { fileURLToPath } from "url";

// Use the test tsconfig import paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.test.json");

export default {
  extensions: {
    ts: "module",
  },
  files: ["test/**/*.test.ts"],
  nodeArguments: ["--loader=tsx"],
  // Increase the timeout if we expect to make live API calls.
  timeout: ["dryrun", "record", "update", "wild"].includes(
    process.env.NOCK_BACK_MODE ?? "lockdown",
  )
    ? "240s"
    : "30s",
  // Use child processes instead of threads because notch isn't thread safe.
  workerThreads: false,
};
