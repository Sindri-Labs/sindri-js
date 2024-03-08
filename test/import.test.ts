// Type checking is disabled in this file because we want type checking to work without the `/dist/`
// directory being populated.
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import test from "ava";
import flatted from "flatted";

// Any `require()` statements actually get treated as ESM imports under the hood in the tests, so
// this is a kind of hacky way to perform the module import in a subprocess. Because we're only
// really interested in whether the different builds and import types work in these tests, this
// should be good enough.
const requireCjs = async (
  modulePath: string,
): Promise<{ [key: string]: unknown }> => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const moduleFullPath = path.resolve(__dirname, modulePath);
  const subprocessCode = `
    // Necessary for the browser tests.
    global.window = {};

    // Use flatted for better handling of non-JSON content, circular referecnes, etc.
    const { stringify } = require("flatted");

    const module = require("${moduleFullPath}");
    process.stdout.write(stringify(module));
  `;

  return new Promise((resolve, reject) => {
    const subprocess = spawn("node", ["-e", subprocessCode], {
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    subprocess.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    let stderr = "";
    subprocess.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    subprocess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = flatted.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse subprocess output:\n\n${stdout}`));
        }
      } else {
        reject(new Error(`Subprocess exited with code ${code}:\n\n${stderr}`));
      }
    });
  });
};

test.before(() => {
  global.window = {} as Window & typeof globalThis;
});

test("cli", async (t) => {
  const cli = await requireCjs("../dist/cli/index.js");
  t.truthy(cli?.program);
});

test("lib browser cjs", async (t) => {
  const lib = await requireCjs("../dist/lib/browser/index.js");
  t.truthy(lib);
  t.false("default" in lib, "library should not be nested under `default`");
});

test("lib browser mjs", async (t) => {
  const { default: lib } = await import("../dist/lib/browser/index.mjs");
  t.truthy(lib);
  t.false("default" in lib, "library should not be nested under `default`");
});

test("lib node cjs", async (t) => {
  const lib = await requireCjs("../dist/lib/index.js");
  t.truthy(lib);
  t.false("default" in lib, "library should not be nested under `default`");
});

test("lib node mjs", async (t) => {
  const { default: lib } = await import("../dist/lib/index.mjs");
  t.truthy(lib);
  t.false("default" in lib, "library should not be nested under `default`");
});
