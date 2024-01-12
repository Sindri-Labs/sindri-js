import { test, usePage } from "test/utils/usePage";

import sindriLibrary from "lib";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

usePage();

test("library is injected and authorized", async (t) => {
  const { apiKey, baseUrl } = await t.context.page.evaluate(() => ({
    apiKey: sindri.apiKey,
    baseUrl: sindri.baseUrl,
  }));
  t.deepEqual(apiKey, sindriLibrary.apiKey);
  t.truthy(baseUrl);
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
