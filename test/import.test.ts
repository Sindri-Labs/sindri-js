import test from "ava";

/* eslint-disable @typescript-eslint/no-var-requires */
// Type checking is also disabled in this file because we want type checking to work without the
// `/dist/` directory being populated.

test.before(() => {
  global.window = {} as Window & typeof globalThis;
});

test("cli", (t) => {
  const cli = require("../dist/cli/index.js");
  t.truthy(cli?.program);
});

test("lib browser cjs", (t) => {
  const lib = require("../dist/lib/browser/index.js");
  t.truthy(lib);
  t.false("false" in lib, "library should not be nested under `default`");
});

test("lib browser mjs", async (t) => {
  const { default: lib } = await import("../dist/lib/browser/index.mjs");
  t.truthy(lib);
  t.false("default" in lib);
});

test("lib node cjs", (t) => {
  const lib = require("../dist/lib/index.js");
  t.truthy(lib);
  t.false("false" in lib, "library should not be nested under `default`");
});

test("lib node mjs", async (t) => {
  const { default: lib } = await import("../dist/lib/index.mjs");
  t.truthy(lib);
  t.false("default" in lib);
});
