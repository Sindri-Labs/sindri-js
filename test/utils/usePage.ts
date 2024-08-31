import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import getPort from "get-port";
import nock, { back as nockBack, type BackMode } from "nock";
import { Proxy } from "http-mitm-proxy";
import puppeteer, { type Browser, type Page } from "puppeteer";

import sindriLibrary from "lib";
import { matchFormPayloads } from "test/utils/matchFormPayloads";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

// Add the context to the test function type.
type Context = {
  browser: Browser;
  nockDone: () => void;
  page: Page;
  proxy: Proxy;
};
export const test = testWithoutContext as TestFn<Context>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createProxy(): Proxy {
  const proxy = new Proxy();
  proxy.use(Proxy.wildcard);

  // The library uses `console.debug()` a lot and it's noisy.
  console.debug = () => {};

  // Squash the sslv3 alerts from Chrome by monkey patching the error handler.
  const originalOnError = proxy._onError;
  proxy._onError = function (kind, ctx, err) {
    if (
      kind === "HTTPS_CLIENT_ERROR" &&
      // @ts-expect-error - The error in question will have `code` but this isn't typed.
      err.code === "ERR_SSL_SSLV3_ALERT_CERTIFICATE_UNKNOWN"
    ) {
      return;
    }
    return originalOnError.call(this, kind, ctx, err);
  };

  proxy.onResponse((ctx, callback) => {
    // Removes the Content-Length header because there's a mismatch.
    ctx.responseContentPotentiallyModified = true;
    callback();
  });
  return proxy;
}

export const usePage = async ({
  mockDate,
}: {
  mockDate: undefined | (() => void);
}) => {
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
    t.context.proxy = createProxy();
    const proxyPort = await getPort();
    await new Promise<void>((resolve, reject) =>
      t.context.proxy.listen({ port: proxyPort }, (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    t.context.browser = await puppeteer.launch({
      headless: true,
      // Ignore certificate errors because the proxy uses a self-signed certificate.
      acceptInsecureCerts: true,
      args: [
        `--proxy-server=http://localhost:${proxyPort}`,
        // Disable CORS because they don't play back correctly with Nock and the proxy.
        "--disable-web-security",
      ],
    });

    // Start recording, and only allow connections to likely API endpoints.
    nock.disableNetConnect();
    // We allow three sources here:
    // * https://localhost.run/'s https://*.lhr.life for development.
    // * https://ngrok.com/ for development.
    // * https://sindri.app/ for production, stage, and development.
    nock.enableNetConnect(
      /^(https?:\/\/)?(.+\.)?(lhr\.life|ngrok-free.app|sindri.app)(:\d+)?$/i,
    );
    nockBack.setMode((process.env.NOCK_BACK_MODE ?? "lockdown") as BackMode);
    const { nockDone } = await nockBack(fixtureFilename, {
      before: matchFormPayloads,
    });
    t.context.nockDone = nockDone;
  });

  test.beforeEach(async (t: ExecutionContext<Context>) => {
    // Open a new browser tab for the test, inject the script tag, and route requests through nock.
    t.context.page = await t.context.browser.newPage();
    await t.context.page.addScriptTag({
      path: sindriScriptPath,
    });
    await t.context.page.evaluate(
      (apiKey, baseUrl, pollingInterval) => {
        sindri.authorize({ apiKey, baseUrl });
        sindri.pollingInterval = pollingInterval;
      },
      sindriLibrary.apiKey ?? undefined,
      sindriLibrary.baseUrl,
      (process.env.NOCK_BACK_MODE ?? "lockdown") === "lockdown" ? 0 : 1000,
    );
    if (mockDate) {
      const mockDatePath = path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "mockdate",
        "lib",
        "mockdate.js",
      );
      await t.context.page.addScriptTag({
        path: mockDatePath,
      });
      await t.context.page.evaluate(mockDate);
    }

    // Attach some more verbose logging.
    t.context.page
      .on("console", (message) =>
        console.log(
          `BROWSER - ${message.type().toUpperCase()} - ${message.text()}`,
        ),
      )
      .on("pageerror", ({ message }) =>
        console.log(`BOWSER ERROR - ${message}`),
      )
      .on("requestfailed", (request) => {
        const requestFailure = request?.failure();
        if (requestFailure) {
          console.log(
            `BROWSER REQUEST FAILED - ${
              requestFailure.errorText
            } ${request.url()}`,
          );
        }
      });
  });

  test.afterEach.always(async (t: ExecutionContext<Context>) => {
    // Close the browser tab after each test.
    if (t.context.page) {
      await t.context.page.close();
    }
  });

  test.after.always(async (t: ExecutionContext<Context>) => {
    // Stop recording and re-enable all network connections.
    if (t.context.nockDone) {
      t.context.nockDone();
    }
    nock.enableNetConnect();
    nockBack.setMode("wild");

    // Close the browser after all tests.
    if (t.context.browser) {
      await t.context.browser.close();
    }

    // Shut down the proxy server.
    if (t.context.proxy) {
      t.context.proxy.close();
    }

    // Ugly... but the process often hangs otherwise. This is only for the child process, AVA still
    // knows whether the tests passed or failed. It prints out an ugly error, but it does work.
    process.exit(0);
  });
};
