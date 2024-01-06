import process from "process";

export default {
  extensions: {
    ts: "module",
  },
  files: ["test/**/*.test.ts"],
  nodeArguments: ["--loader=tsx"],
  // Increase the timeout if we expect to make live API calls.
  timeout: ["dryrun", "record", "update", "wild"].includes(
    process.NOCK_BACK_MODE ?? "lockdown",
  )
    ? 60000
    : 10000,
  // Use child processes instead of threads because notch isn't thread safe.
  workerThreads: false,
};
