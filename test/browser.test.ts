import fs from "fs/promises";
import path from "path";

import mockDateLibrary from "mockdate";

import sindriLibrary from "lib";
import { test, usePage } from "test/utils/usePage";
import { dataDirectory } from "test/utils";

// The `sindri` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type SindriLibrary = typeof sindriLibrary;
declare const sindri: SindriLibrary;

// The `mockdate` library is injected in `withPage.ts`, but this tells TypeScript what the type is.
type MockDateLibrary = typeof mockDateLibrary;
declare const MockDate: MockDateLibrary;

usePage({
  // We need to lock the date because it's used as the modified time of tarballs.
  mockDate: () => MockDate.set("2024-01-01T00:00:00.000Z"),
});

test("library is injected and authorized", async (t) => {
  const { apiKey, baseUrl } = await t.context.page.evaluate(() => ({
    apiKey: sindri.apiKey,
    baseUrl: sindri.baseUrl,
  }));
  t.deepEqual(apiKey, sindriLibrary.apiKey);
  t.truthy(baseUrl);
});

test("access to google.com is blocked", async (t) => {
  const status: number | null = await t.context.page.evaluate(async () => {
    sindri._clientConfig.BASE = "https://accounts.google.com";
    try {
      const response: { status: number } = await sindri._client.request.request(
        {
          method: "GET",
          url: "/ListAccounts",
        },
      );
      return response?.status ?? null;
    } catch (error) {
      return (error as { status: number })?.status ?? null;
    }
  });
  t.deepEqual(
    status,
    500,
    "Requests to google.com delays should be blocked with a 500 status code.",
  );
});

test("create circuit from file array", async (t) => {
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );

  await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    await sindri.createCircuit(files, ["from-browser-file-array"]);
  }, fileData);

  t.true(true);
});

test("create proof", async (t) => {
  // Create a circuit first.
  const tag = "browser-create-proof-multiplier2-circuit";
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );
  await t.context.page.evaluate(
    async (fileData, tag) => {
      const files = fileData.map(
        ({ content, fileName }) => new File([content], fileName),
      );
      await sindri.createCircuit(files, [tag]);
    },
    fileData,
    tag,
  );

  // Create a proof.
  const proofInput = await fs.readFile(
    path.join(circuitDirectory, "input.json"),
    "utf-8",
  );
  const proofResponse = await t.context.page.evaluate(
    async (circuitIdentifier, proofInput) => {
      return await sindri.proveCircuit(circuitIdentifier, proofInput);
    },
    `circom-multiplier2:${tag}`,
    proofInput,
  );
  t.true(proofResponse?.status === "Ready");
});

test("fetch robots.txt", async (t) => {
  const content = await t.context.page.evaluate(async () => {
    const response = await fetch("https://sindri.app/robots.txt");
    return await response.text();
  });
  t.true(content?.includes("sitemap"));
});

test("get all circuit proofs", async (t) => {
  // Compile a circuit.
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );
  const circuit = await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    return await sindri.createCircuit(files, [
      "from-browser-file-array-for-get-all-circuit-proofs",
    ]);
  }, fileData);

  // Create a proof.
  const proof = await t.context.page.evaluate(async (circuit) => {
    return await sindri.proveCircuit(circuit.circuit_id, '{"a":"5","b":"4"}');
  }, circuit);
  t.truthy(proof?.proof_id);

  // Get all circuit proofs.
  const proofs = await t.context.page.evaluate(async (circuit) => {
    return await sindri.getAllCircuitProofs(circuit.circuit_id);
  }, circuit);
  t.truthy(proofs);
  t.deepEqual(proofs.length, 1);
  t.deepEqual(proofs[0]?.circuit_id, circuit?.circuit_id);
  t.truthy(proofs[0]?.circuit_id);
});

test("get all circuits", async (t) => {
  const circuits = await t.context.page.evaluate(async () =>
    sindri.getAllCircuits(),
  );
  t.true(Array.isArray(circuits));
  t.true(circuits.length > 0);
  t.truthy(circuits[0]?.circuit_id);
});

test("get proof", async (t) => {
  // Compile a circuit and create a proof.
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );
  const circuit = await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    return await sindri.createCircuit(files, [
      "from-browser-file-array-for-get-proof",
    ]);
  }, fileData);
  const proof = await t.context.page.evaluate(async (circuit) => {
    return await sindri.proveCircuit(circuit.circuit_id, '{"a":"5","b":"4"}');
  }, circuit);
  t.truthy(proof?.proof_id);

  // Check that we can retrieve the proof using `sindri.getProof()`.
  const retrievedProof = await t.context.page.evaluate(
    async (proofId) => sindri.getProof(proofId),
    proof!.proof_id,
  );
  t.truthy(retrievedProof?.proof_id);
  t.deepEqual(proof?.proof_id, retrievedProof.proof_id);
});

test("get circuit", async (t) => {
  // Compile a circuit.
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );
  const circuit = await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    return await sindri.createCircuit(files, [
      "from-browser-file-array-for-get-circuit",
    ]);
  }, fileData);

  // Get the circuit.
  const retrievedCircuit = await t.context.page.evaluate(async (circuitId) => {
    return await sindri.getCircuit(circuitId);
  }, circuit.circuit_id);
  t.truthy(retrievedCircuit);
  t.deepEqual(circuit.circuit_id, retrievedCircuit.circuit_id);
});

test("prove circuit", async (t) => {
  // Compile a circuit.
  const circuitDirectory = path.join(dataDirectory, "circom-multiplier2");
  const fileNames = await fs.readdir(circuitDirectory);
  const fileData = await Promise.all(
    fileNames.map(async (fileName) => ({
      content: await fs.readFile(
        path.join(circuitDirectory, fileName),
        "utf-8",
      ),
      fileName,
    })),
  );
  const circuit = await t.context.page.evaluate(async (fileData) => {
    const files = fileData.map(
      ({ content, fileName }) => new File([content], fileName),
    );
    return await sindri.createCircuit(files, [
      "from-browser-file-array-for-prove-circuit",
    ]);
  }, fileData);

  // Create a proof.
  const proof = await t.context.page.evaluate(async (circuit) => {
    return await sindri.proveCircuit(circuit.circuit_id, '{"a":"5","b":"4"}');
  }, circuit);
  t.truthy(proof?.proof_id);
});
