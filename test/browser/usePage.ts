import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import nock, { back as nockBack } from "nock";
import useNockWithWrongTypes from "nock-puppeteer";
import puppeteer, {
  type Browser,
  type Page,
  type ResourceType,
} from "puppeteer";

// Fix the types on `useNock`.
const useNock = useNockWithWrongTypes as (
  page: Page,
  allowedHosts: string[],
  supportedResourceTypes?: ResourceType[],
) => Promise<void>;

// Add the context to the test function type.
export const test = testWithoutContext as TestFn<{
  browser: Browser;
  nockDone: () => void;
  page: Page;
}>;

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

  test.before(async (t: ExecutionContext) => {
    // Launch the Puppeteer browser without any nock interference.
    nockBack.setMode("wild");
    nock.enableNetConnect();
    t.context.browser = await puppeteer.launch({ headless: "new" });

    // Start recording, and only allow connections to `sindri.app`.
    nock.disableNetConnect();
    nock.enableNetConnect("sindri.app");
    nockBack.setMode("lockdown");
    console.log("Fixture location:", nockBack.fixtures, fixtureFilename);
    const { nockDone } = await nockBack(fixtureFilename);
    t.context.nockDone = nockDone;
  });

  test.beforeEach(async (t: ExecutionContext) => {
    // Open a new browser tab for the test, inject the script tag, and route requests through nock.
    t.context.page = await t.context.browser.newPage();
    await t.context.page.addScriptTag({
      path: sindriScriptPath,
    });
    useNock(t.context.page, ["https://sindri.app"]);
  });

  test.afterEach.always(async (t: ExecutionContext) => {
    // Close the browser tab after each test.
    if (t.context.page) {
      await t.context.page.close();
    }
  });

  test.after.always(async (t: ExecutionContext) => {
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
