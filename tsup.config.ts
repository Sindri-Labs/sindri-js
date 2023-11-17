import { defineConfig } from 'tsup';

export default defineConfig([
  // SDK for NodeJS.
  {
    cjsInterop: true,
    entry: ['src/lib/index.ts'],
    format: ['cjs', 'esm'],
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist/lib',
    sourcemap: true,
    // CJS interop is broken without splitting, see:
    //   * https://github.com/egoist/tsup/issues/992#issuecomment-1763540165
    splitting: true,
    target: 'esnext',
  },
  // SDK for Browser.
  {
    entry: ['src/lib/index.ts'],
    format: ['cjs', 'esm'],
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist/lib/browser',
    sourcemap: true,
    splitting: true,
    target: 'esnext',
    // Additional browser-specific configuration will go here (e.g. polyfills).
  },
  // CLI Tool.
  {
    bundle: true,
    entry: ['src/cli/index.ts'],
    format: ['cjs'],
    minify: process.env.NODE_ENV === 'production',
    outDir: 'dist/cli',
    sourcemap: true,
    target: 'node12',
  }
]);
