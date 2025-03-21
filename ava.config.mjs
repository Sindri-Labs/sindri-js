import path from "path";
import process from "process";
import { fileURLToPath } from "url";

// Use the test tsconfig import paths.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.env.TSX_TSCONFIG_PATH = path.join(__dirname, "tsconfig.test.json");

let timeout;
if (process.env.TEST_TIMEOUT) {
  // Allow the timeout to be specified with the `TEST_TIMEOUT` environment variable.
  timeout = process.env.TEST_TIMEOUT;
  // Default to seconds if no unit is specified.
  if (/^\d+$/.test(timeout)) {
    timeout = `${timeout}s`;
  }
} else {
  // Set the default fallback timeout and increase it if we expect to make live API calls.
  if (
    ["dryrun", "record", "update", "wild"].includes(
      process.env.NOCK_BACK_MODE ?? "lockdown",
    )
  ) {
    timeout = "10m";
  } else {
    timeout = "60s";
  }
}

export default {
  extensions: {
    ts: "module",
  },
  files: ["test/**/*.test.ts"],
  require: ["test/utils/makeAxiosErrorsSerializable.ts"],
  timeout,
  // Use child processes instead of threads because notch isn't thread safe.
  workerThreads: false,
};
