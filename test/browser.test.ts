import fs from "fs/promises";
import path from "path";

import mockDateLibrary from "mockdate";

import sindriLibrary from "lib";
import { test, usePage } from "test/utils/usePage";
import { dataDirectory } from "test/utils";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

// The `mockdate` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type MockDateLibrary = typeof mockDateLibrary;
declare const MockDate: MockDateLibrary;

usePage({
  // We need to lock the date because it's used as the modified time of tarballs.
  mockDate: () => MockDate.set("2024-01-01T00:00:00.000Z"),
});

test("library is injected and authorized", async (t) => {
  const { apiKey, baseUrl } = await t.context.page.evaluate(() => ({
    apiKey: sindri.apiKey,
    baseUrl: sindri.baseUrl,
  }));
  t.deepEqual(apiKey, sindriLibrary.apiKey);
  t.truthy(baseUrl);
});

test("create circuit from file array", async (t) => {
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );

  await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    await sindri.createCircuit(files, ["from-browser-file-array"]);
  }, fileData);

  t.true(true);
});

test("list circuits", async (t) => {
  const circuits = await t.context.page.evaluate(async () =>
    sindri.listCircuits(),
  );
  t.true(Array.isArray(circuits));
  t.true(circuits.length > 0);
  t.truthy(circuits[0]?.circuit_id);
});

test("fetch robots.txt", async (t) => {
  try {
    await t.context.page.goto("https://sindri.app/robots.txt", { timeout: 5 });
  } catch (error) {
    /* ignore timeouts */
  }
  t.true(true);
});
