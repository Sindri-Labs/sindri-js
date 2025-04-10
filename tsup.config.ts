import esbuild from "esbuild";
import { defineConfig } from "tsup";

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.VERSION = process.env.VERSION || "0.0.0";
const dts = (process.env.TSUP_DTS ?? "true") !== "false";

export default defineConfig([
  // SDK for NodeJS.
  {
    cjsInterop: true,
    dts,
    entry: ["src/lib/index.ts"],
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERSION: process.env.VERSION,
    },
    format: ["cjs", "esm"],
    minify: process.env.NODE_ENV === "production",
    outDir: "dist/lib",
    shims: true,
    sourcemap: true,
    // CJS interop is broken without splitting, see:
    //   * https://github.com/egoist/tsup/issues/992#issuecomment-1763540165
    splitting: true,
    target: "esnext",
  },
  // SDK for Browser.
  {
    dts,
    entry: ["src/lib/index.ts"],
    env: {
      BROWSER_BUILD: "true",
      NODE_ENV: process.env.NODE_ENV,
      VERSION: process.env.VERSION,
    },
    format: ["cjs", "esm"],
    minify: process.env.NODE_ENV === "production",
    outDir: "dist/lib/browser",
    shims: true,
    sourcemap: true,
    splitting: true,
    target: "esnext",
    treeshake: "smallest",
    // Produce an IIFE bundle for use with a <script> tag in a browser.
    onSuccess: async () => {
      await esbuild.build({
        bundle: true,
        entryPoints: ["dist/lib/browser/index.mjs"],
        format: "iife",
        footer: {
          js: "var sindri = sindriExports.default;",
        },
        globalName: "sindriExports",
        minify: process.env.NODE_ENV === "production",
        outfile: "dist/lib/browser/sindri.iife.js",
        platform: "browser",
        sourcemap: true,
      });
    },
    // Additional browser-specific configuration will go here (e.g. polyfills).
  },
  // CLI Tool.
  {
    bundle: true,
    dts,
    entry: ["src/cli/index.ts"],
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERSION: process.env.VERSION,
    },
    format: ["cjs"],
    minify: process.env.NODE_ENV === "production",
    outDir: "dist/cli",
    shims: true,
    sourcemap: true,
    target: "node18",
  },
]);
