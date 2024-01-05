import esbuild from "esbuild";
import { defineConfig } from "tsup";

export default defineConfig([
  // SDK for NodeJS.
  {
    cjsInterop: true,
    dts: true,
    entry: ["src/lib/index.ts"],
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
    dts: true,
    entry: ["src/lib/index.ts"],
    format: ["cjs", "esm"],
    minify: process.env.NODE_ENV === "production",
    outDir: "dist/lib/browser",
    shims: true,
    sourcemap: true,
    splitting: true,
    target: "esnext",
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
    dts: true,
    entry: ["src/cli/index.ts"],
    format: ["cjs"],
    minify: process.env.NODE_ENV === "production",
    outDir: "dist/cli",
    shims: true,
    sourcemap: true,
    target: "node18",
  },
]);
