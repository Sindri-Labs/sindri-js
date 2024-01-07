import lib from "lib";

import { test, useNock } from "test/utils/useNock";

useNock();

test("should get Sindri manifest schema JSON", async (t) => {
  const schema = await lib.getSindriManifestSchema();
  t.true(schema?.title?.includes("Sindri"));
});

test("should get Sindri manifest schema JSON duplicate", async (t) => {
  const schema = await lib.getSindriManifestSchema();
  t.true(schema?.title?.includes("Sindri"));
});

test("library can be imported", (t) => {
  t.true(
    lib.environment && ["development", "production"].includes(lib.environment),
  );
});
