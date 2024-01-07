import lib from "lib";

import { test, useNock } from "test/utils/useNock";

useNock();

test("fetch Sindri manifest schema JSON", async (t) => {
  const schema = await lib.getSindriManifestSchema();
  t.true(schema?.title?.includes("Sindri"));
});

test("fetch Sindri manifest schema JSON in parallel", async (t) => {
  const schema = await lib.getSindriManifestSchema();
  t.true(schema?.title?.includes("Sindri"));
});

test("import library", (t) => {
  t.true(
    lib.environment && ["development", "production"].includes(lib.environment),
  );
});
