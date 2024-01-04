export default {
  extensions: {
    ts: "module",
  },
  files: ["test/**/*.test.ts"],
  nodeArguments: ["--loader=tsx"],
};
