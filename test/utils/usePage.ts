import fs from "fs";
import http from "http";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import getPort from "get-port";
import nock, { back as nockBack, type BackMode } from "nock";
import { createProxy } from "proxy";
import puppeteer, { type Browser, type Page } from "puppeteer";

import sindriLibrary from "lib";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

// Add the context to the test function type.
type Context = {
  browser: Browser;
  nockDone: () => void;
  page: Page;
  proxy: http.Server;
};
export const test = testWithoutContext as TestFn<Context>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const usePage = async () => {
  // Prepare the nock fixture paths.
  const testPath = test.meta.file.replace(/^file:/, "");
  nockBack.fixtures = path.join(path.dirname(testPath), "fixtures");
  const testFilenamePrefix = path.basename(testPath);
  const fixtureFilename = `${testFilenamePrefix}.json`;

  // Find the location of the Sindri IIFE script.
  const sindriScriptPath = path.join(
    __dirname,
    "..",
    "..",
    "dist",
    "lib",
    "browser",
    "sindri.iife.js",
  );
  if (!fs.existsSync(sindriScriptPath)) {
    throw new Error(`Expected IIFE build to exist at "${sindriScriptPath}".`);
  }

  test.before(async (t: ExecutionContext<Context>) => {
    // Disable nock interference until after we have the browser launched and connected.
    nockBack.setMode("wild");
    nock.enableNetConnect();

    // Start a proxy server and launch a browser with Puppeteer that uses it.
    const proxyPort = await getPort();
    t.context.proxy = createProxy(http.createServer());
    await new Promise((resolve) => t.context.proxy.listen(proxyPort, resolve));
    t.context.browser = await puppeteer.launch({
      headless: "new",
      args: [`--proxy-server=http://localhost:${proxyPort}`],
    });

    // Start recording, and only allow connections to `sindri.app`.
    nock.disableNetConnect();
    nock.enableNetConnect("sindri.app");
    nockBack.setMode((process.env.NOCK_BACK_MODE ?? "lockdown") as BackMode);
    const { nockDone } = await nockBack(fixtureFilename);
    t.context.nockDone = nockDone;
  });

  test.beforeEach(async (t: ExecutionContext<Context>) => {
    // Open a new browser tab for the test, inject the script tag, and route requests through nock.
    t.context.page = await t.context.browser.newPage();
    await t.context.page.addScriptTag({
      path: sindriScriptPath,
    });
    await t.context.page.evaluate(
      (apiKey, baseUrl) => {
        sindri.authorize({ apiKey, baseUrl });
      },
      sindriLibrary.apiKey ?? undefined,
      sindriLibrary.baseUrl,
    );
  });

  test.afterEach.always(async (t: ExecutionContext<Context>) => {
    // Close the browser tab after each test.
    if (t.context.page) {
      await t.context.page.close();
    }
  });

  test.after.always(async (t: ExecutionContext<Context>) => {
    // Close the browser after all tests.
    if (t.context.browser) {
      await t.context.browser.close();
    }

    // Shut down the proxy server.
    if (t.context.proxy) {
      t.context.proxy.close();
    }

    // Stop recording and re-enable all network connections.
    if (t.context.nockDone) {
      t.context.nockDone();
    }
    nock.enableNetConnect();
    nockBack.setMode("wild");
  });
};
