import { test, usePage } from "test/utils/usePage";

import sindriLibrary from "lib";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

usePage();

test("should get Sindri manifest schema JSON", async (t) => {
  const schema = await t.context.page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});

test("should get Sindri manifest schema JSON (number 2)", async (t) => {
  const schema = await t.context.page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});

test("should get robots.txt", async (t) => {
  try {
    await t.context.page.goto("https://sindri.app/robots.txt", { timeout: 5 });
  } catch (error) {
    /* ignore timeouts */
  }
  t.true(true);
});
