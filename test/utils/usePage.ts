import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import nock, {
  back as nockBack,
  type BackMode,
  type Definition as NockDefinition,
} from "nock";
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
};
export const test = testWithoutContext as TestFn<Context>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function patchFormBoundaries(scope: NockDefinition) {
  const boundaryRegex = /------WebKitFormBoundary................/g;
  // @ts-expect-error - Types are wrong.
  scope.filteringRequestBody = (
    body: string | null,
    recordedBody: string | null,
  ) => {
    if (typeof body !== "string" || typeof recordedBody !== "string") {
      return body;
    }

    if (
      body.replace(boundaryRegex, "") ===
      recordedBody.replace(boundaryRegex, "")
    ) {
      return recordedBody;
    }

    try {
      const text = Buffer.from(body, "hex").toString("utf-8");
      const recordedText = Buffer.from(recordedBody, "hex").toString("utf-8");
      if (
        text.replace(boundaryRegex, "") ===
        recordedText.replace(boundaryRegex, "")
      ) {
        return recordedBody;
      }
    } catch {
      /* Means it wasn't hex, no problem. */
    }
    return body;
  };
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

    t.context.browser = await puppeteer.launch({
      headless: "new",
      args: [
        // Disable CORS because they don't play back correctly with Nock and the proxy.
        "--disable-web-security",
      ],
    });

    // Start recording, and only allow connections to `sindri.app`.
    nock.disableNetConnect();
    nock.enableNetConnect("sindri.app");
    nockBack.setMode((process.env.NOCK_BACK_MODE ?? "lockdown") as BackMode);
    const { nockDone } = await nockBack(fixtureFilename, {
      before: patchFormBoundaries,
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
    // await new Promise((resolve) => setTimeout(resolve, 30000));
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

    // Stop recording and re-enable all network connections.
    if (t.context.nockDone) {
      t.context.nockDone();
    }
    nock.enableNetConnect();
    nockBack.setMode("wild");
  });
};
