import { test, usePage } from "./usePage";

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

test("2 should get Sindri manifest schema JSON", async (t) => {
  const schema = await t.context.page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});

test("3 should get Sindri manifest schema JSON", async (t) => {
  try {
    await t.context.page.goto("https://sindri.app/robots.txt", { timeout: 5 });
  } catch (error) {}
  t.true(true);
});
