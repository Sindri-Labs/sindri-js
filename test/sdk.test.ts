import { File } from "buffer";
import fs from "fs/promises";
import path from "path";

import axios from "axios";
import MockDate from "mockdate";
import sharp from "sharp";

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

test("upload avatar image", async (t) => {
  // Hack in fixed headers so nock can match the request.
  const oldHeaders = sindri._clientConfig.HEADERS;
  sindri._clientConfig.HEADERS = {
    ...oldHeaders,
    "Content-Type":
      "multipart/form-data; boundary=----WebKitFormBoundary1234567890UploadAvatarImage",
  };

  try {
    // Create a 1x1 red image to upload.
    const redImageBuffer = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3, // RGB
        background: { r: 255, g: 0, b: 0 }, // Red color
      },
    })
      .png({ compressionLevel: 0, effort: 1 })
      .toBuffer();
    const imageFile = new File([redImageBuffer], "red-1x1.png") as Blob;

    // Upload the avatar image.
    const { team } = await sindri._client.internal.teamAvatarUpload({
      files: [imageFile],
    });
    t.truthy(team);
    t.truthy(team.avatar_url);
    t.notRegex(
      team.avatar_url,
      /gravatar/,
      "Avatar URL should not be a Gravatar.",
    );

    // Download the avatar image and verify that it's a 1x1 red pixel.
    const response = await axios({
      url: team.avatar_url,
      responseType: "arraybuffer",
    });
    const image = await sharp(response.data)
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Grab the first three bytes (R, G, B) of the image to check the color.
    const [r, g, b] = image.data;
    t.is(r, 255);
    t.is(g, 0);
    t.is(b, 0);
  } finally {
    // Restore the original headers.
    sindri._clientConfig.HEADERS = oldHeaders;
  }
});
