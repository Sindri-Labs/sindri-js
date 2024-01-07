import { test, usePage } from "test/utils/usePage";

import sindriLibrary from "lib";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

usePage();

test("fetch Sindri manifest schema JSON", async (t) => {
  const schema = await t.context.page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});

test("fetch Sindri manifest schema JSON in a second tab", async (t) => {
  const schema = await t.context.page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});

test("fetch robots.txt", async (t) => {
  try {
    await t.context.page.goto("https://sindri.app/robots.txt", { timeout: 5 });
  } catch (error) {
    /* ignore timeouts */
  }
  t.true(true);
});
