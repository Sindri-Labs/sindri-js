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
  sindri.pollingInterval =
    (process.env.NOCK_BACK_MODE ?? "lockdown") === "lockdown" ? 0 : 1000;
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
  const circuitTarballDirectory = path.join(
    dataDirectory,
    "circom-multiplier2.tgz",
  );
  await sindri.createCircuit(circuitTarballDirectory, ["from-tarball"]);
  t.true(true);
});

test("create proof", async (t) => {
  // Create a circuit first.
  const tag = "sdk-create-proof-multiplier2-circuit";
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const circuitResponse = await sindri.createCircuit(circuitDirectory, [tag]);
  t.true(circuitResponse.status === "Ready");

  // Create a proof.
  const proofInput = await fs.readFile(
    path.join(circuitDirectory, "input.json"),
    "utf-8",
  );
  const proofResponse = await sindri.proveCircuit(
    `circom-multiplier2:${tag}`,
    proofInput,
  );
  t.true(proofResponse?.status === "Ready");
});

test("get all circuit proofs", async (t) => {
  // Compile a circuit.
  const circuitTarballDirectory = path.join(
    dataDirectory,
    "circom-multiplier2.tgz",
  );
  const circuit = await sindri.createCircuit(circuitTarballDirectory, [
    "from-tarball-for-all-circuit-proofs",
  ]);
  t.truthy(circuit?.circuit_id);

  // Create a proof.
  const proof = await sindri.proveCircuit(
    circuit.circuit_id,
    '{"a":"5","b":"4"}',
  );
  t.truthy(proof?.proof_id);

  // Get all circuit proofs.
  const proofs = await sindri.getAllCircuitProofs(circuit.circuit_id);
  t.truthy(proofs);
  t.deepEqual(proofs.length, 1);
  t.deepEqual(proofs[0]?.circuit_id, circuit?.circuit_id);
  t.truthy(proofs[0]?.circuit_id);
});

test("get all circuits", async (t) => {
  const circuits = await sindri.getAllCircuits();
  t.true(Array.isArray(circuits));
  t.true(circuits.length > 0);
  t.truthy(circuits[0]?.circuit_id);
});

test("get circuit", async (t) => {
  // Compile a circuit.
  const circuitTarballDirectory = path.join(
    dataDirectory,
    "circom-multiplier2.tgz",
  );
  const circuit = await sindri.createCircuit(circuitTarballDirectory, [
    "from-tarball-for-get-circuit",
  ]);
  t.truthy(circuit?.circuit_id);

  // Get the circuit.
  const retrievedCircuit = await sindri.getCircuit(circuit.circuit_id);
  t.truthy(retrievedCircuit);
  t.deepEqual(circuit.circuit_id, retrievedCircuit.circuit_id);
});

test("get proof", async (t) => {
  // Compile a circuit and create a proof.
  const circuitTarballDirectory = path.join(
    dataDirectory,
    "circom-multiplier2.tgz",
  );
  const circuit = await sindri.createCircuit(circuitTarballDirectory, [
    "from-tarball-for-get-proof",
  ]);
  const proof = await sindri.proveCircuit(
    circuit.circuit_id,
    '{"a":"5","b":"4"}',
  );
  t.truthy(proof?.proof_id);

  // Check that we can retrieve the proof using `sindri.getProof()`.
  const retrievedProof = await sindri.getProof(proof!.proof_id);
  t.truthy(retrievedProof?.proof_id);
  t.deepEqual(proof.proof_id, retrievedProof.proof_id);
});

test("prove circuit", async (t) => {
  // Compile a circuit.
  const circuitTarballDirectory = path.join(
    dataDirectory,
    "circom-multiplier2.tgz",
  );
  const circuit = await sindri.createCircuit(circuitTarballDirectory, [
    "from-tarball-for-prove-circuit",
  ]);

  // Create a proof.
  const proof = await sindri.proveCircuit(
    circuit.circuit_id,
    '{"a":"5","b":"4"}',
  );
  t.truthy(proof?.proof_id);
});
