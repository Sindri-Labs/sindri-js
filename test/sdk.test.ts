import sindri from "lib";

import { test, useNock } from "test/utils/useNock";

useNock();

test("list circuits", async (t) => {
  const circuits = await sindri.listCircuits();
  t.true(Array.isArray(circuits));
  t.true(circuits.length > 0);
});
