export default {
  extensions: {
    ts: "module",
  },
  files: ["test/**/*.test.ts"],
  nodeArguments: ["--loader=tsx"],
  // Use child processes instead of threads because notch isn't thread safe.
  workerThreads: false,
};
