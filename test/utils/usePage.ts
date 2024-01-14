import fs from "fs";
import http from "http";
import path from "path";
import process from "process";
import { fileURLToPath, URL } from "url";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import getPort from "get-port";
import nock, { back as nockBack, type BackMode } from "nock";
import { Proxy } from "http-mitm-proxy";
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
  proxy: Proxy;
};
export const test = testWithoutContext as TestFn<Context>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Transform } from "stream";

class FormBoundaryStream extends Transform {
  private buffer: Buffer;

  constructor() {
    super();
    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk: Buffer, encoding: string, callback: Function) {
    // Append the incoming chunk to the buffer
    this.buffer = Buffer.concat([this.buffer, chunk]);
    callback();
  }

  _flush(callback: Function) {
    // Modify the buffer here
    let modifiedData = this.modifyData(this.buffer);

    // Push the modified data to be read
    this.push(modifiedData);
    callback();
  }

  modifyData(data: Buffer): Buffer {
    // Perform your data modification here
    // This is a placeholder for your logic
    return data;
  }
}

const createProxy = (): Proxy => {
  const proxy = new Proxy();
  proxy.use(Proxy.wildcard);

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

  proxy.onRequest(function (ctx, callback) {
    //ctx.addRequestFilter(FormBoundaryStream);
    // ctx.clientToProxyRequest;
    // Accumulate the request chunks as they come in.
    const requestChunks: Buffer[] = [];
    ctx.onRequestData(function (ctx, chunk, callback) {
      requestChunks.push(chunk);
      return callback(null, chunk);
    });

    // Proceed with the request.
    return callback();
  });

  return proxy;
};

export const createProxyServer = () =>
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
    // t.context.proxy = createProxyServer();
    //
    t.context.proxy = createProxy();
    const proxyPort = await getPort();
    //await new Promise<void>((resolve) =>
    // t.context.proxy.listen(proxyPort, resolve),
    //);
    await new Promise<void>((resolve, reject) =>
      t.context.proxy.listen({ port: proxyPort }, (error) =>
        error ? reject(error) : resolve(),
      ),
    );
    t.context.browser = await puppeteer.launch({
      headless: "new",
      // Ignore certificate errors because the proxy uses a self-signed certificate.
      ignoreHTTPSErrors: true,
      args: [
        // `--proxy-server=http://localhost:${proxyPort}`,
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
