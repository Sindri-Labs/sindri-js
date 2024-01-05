import baseConfig from "./ava.config.base.mjs";

export default {
  ...baseConfig,
  files: ["test/lib/**/*.test.ts"],
};
