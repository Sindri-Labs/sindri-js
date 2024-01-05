import test from "ava";

import lib from "lib";

test("testImport", (t) => {
  t.is(lib.environment, "production");
});
