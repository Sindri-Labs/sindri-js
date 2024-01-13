import { File } from "buffer";
import fs from "fs/promises";
import path from "path";

import MockDate from "mockdate";

import sindri from "lib";

import { dataDirectory } from "test/utils";
import { test, useNock } from "test/utils/useNock";

useNock();

// We need to lock the date because it's used as the modified time of tarballs.
test.before(() => {
  MockDate.set("2024-01-01T00:00:00.000Z");
});
test.after.always(() => {
  MockDate.reset();
});

test("create circuit from directory", async (t) => {
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  await sindri.createCircuit(circuitDirectory, ["from-directory"]);
  t.true(true);
});

test("create circuit from file array", async (t) => {
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const files = await Promise.all(
    fileNames.map(
      async (fileName) =>
        new File(
          [await fs.readFile(path.join(circuitDirectory, fileName))],
          fileName,
        ),
    ),
  );
  await sindri.createCircuit(files, ["from-file-array"]);
  t.true(true);
});

test("create circuit from tarball", async (t) => {
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2.tgz");
  await sindri.createCircuit(circuitDirectory, ["from-tarball"]);
  t.true(true);
});

test("list circuits", async (t) => {
  const circuits = await sindri.listCircuits();
  t.true(Array.isArray(circuits));
  t.true(circuits.length > 0);
  t.truthy(circuits[0]?.circuit_id);
});
