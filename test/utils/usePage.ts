import fs from "fs";
import http from "http";
import path from "path";
import process from "process";
import { fileURLToPath, URL } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import getPort from "get-port";
import nock, { back as nockBack, type BackMode } from "nock";
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

const createProxyServer = () =>
  http.createServer((req, res) => {
    const requestChunks: Buffer[] = [];

    req.on("data", (chunk) => {
      requestChunks.push(chunk);
    });

    req.on("end", () => {
      // Combine chunks into a single buffer
      let dataBuffer = Buffer.concat(requestChunks);

      if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
        const oldBoundary = (/boundary=(.*)$/.exec(
          (req.headers ?? {})["content-type"] ?? "",
        ) ?? [])[1];
        const newBoundary =
          "sindri-test-boundary-agkhdgfkjh234234234hksgfkgsdljhbcxc";

        if (oldBoundary) {
          // Convert your boundary strings to buffers
          const oldBoundaryBuffer = Buffer.from(`--${oldBoundary}`, "utf-8");
          const newBoundaryBuffer = Buffer.from(`--${newBoundary}`, "utf-8");

          // Find and replace the old boundary with the new boundary in the buffer
          let index,
            offset = 0;
          while (
            (index = dataBuffer.indexOf(oldBoundaryBuffer, offset)) !== -1
          ) {
            dataBuffer = Buffer.concat([
              dataBuffer.subarray(0, index),
              newBoundaryBuffer,
              dataBuffer.subarray(index + oldBoundaryBuffer.length),
            ]);
            offset = index + newBoundaryBuffer.length;
          }

          req.headers["content-type"] =
            `multipart/form-data; boundary=${newBoundary}`;
          req.headers["content-length"] =
            Buffer.byteLength(dataBuffer).toString();
        }
      }

      // Construct the destination URL
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const destinationUrl = new URL(
        req.url as string,
        `${protocol}://${host}`,
      );

      // Forward the request
      const options = {
        agent: http.globalAgent,
        headers: req.headers,
        hostname: destinationUrl.hostname,
        method: req.method,
        path: destinationUrl.pathname + destinationUrl.search,
        port: destinationUrl.port || (protocol === "https" ? 443 : 80),
      };

      const proxyReq = http.request(options, (proxyRes) => {
        const responseChunks: Buffer[] = [];
        proxyRes.on("data", (chunk) => {
          responseChunks.push(chunk);
        });

        proxyRes.on("end", () => {
          const responseBody = Buffer.concat(responseChunks);
          proxyRes.headers["content-length"] =
            Buffer.byteLength(responseBody).toString();
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
          res.end(responseBody);
        });
      });

      proxyReq.write(dataBuffer);
      proxyReq.end();
    });
  });

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
    t.context.proxy = createProxyServer();
    const proxyPort = await getPort();
    await new Promise<void>((resolve) =>
      t.context.proxy.listen(proxyPort, resolve),
    );
    t.context.browser = await puppeteer.launch({
      headless: "new",
      args: [
        `--proxy-server=http://localhost:${proxyPort}`,
        "--disable-web-security",
      ],
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
      .on("pageerror", ({ message }) => console.log(message))
      .on("response", (response) =>
        console.log(`${response.status()} ${response.url()}`),
      )
      .on("requestfailed", (request) => {
        const requestFailure = request?.failure();
        if (requestFailure) {
          console.log(`${requestFailure.errorText} ${request.url()}`);
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
