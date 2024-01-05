import test from "ava";
import withPage from "./withPage";

import sindriLibrary from "lib";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

test("should get Sindri manifest schema JSON", withPage, async (t, page) => {
  const schema = await page.evaluate(async () =>
    sindri.getSindriManifestSchema(),
  );
  t.true(schema?.title?.includes("Sindri"));
});
