import { readFile, stat } from "fs/promises";
import path from "path";
import type { Readable } from "stream";

import gzip from "gzip-js";
import walk from "ignore-walk";
import tar from "tar";
import Tar from "tar-js";

import {
  CircuitsService,
  CircuitStatus,
  CircuitType,
  OpenAPI,
  ProofsService,
  ProofStatus,
} from "lib/api";
import type {
  CircomCircuitInfoResponse,
  Halo2CircuitInfoResponse,
  GnarkCircuitInfoResponse,
  NoirCircuitInfoResponse,
  ProofInfoResponse,
} from "lib/api";
import { loadConfig } from "lib/config";
import { logger, LogLevel } from "lib/logging";
import { File, FormData } from "lib/isomorphic";
import type {
  BrowserFile,
  BrowserFormData,
  NodeFile,
  NodeFormData,
} from "lib/isomorphic";

// Re-export types from the API.
export { CircuitStatus, CircuitType, ProofStatus };
export type {
  CircomCircuitInfoResponse,
  GnarkCircuitInfoResponse,
  Halo2CircuitInfoResponse,
  NoirCircuitInfoResponse,
  ProofInfoResponse,
};
export type CircuitInfoResponse =
  | CircomCircuitInfoResponse
  | Halo2CircuitInfoResponse
  | GnarkCircuitInfoResponse
  | NoirCircuitInfoResponse;

/**
 * The options for authenticating with the API.
 */
export interface AuthOptions {
  /**
   * The API key to use for authentication.
   */
  apiKey?: string;
  /**
   * The base URL for the API.
   */
  baseUrl?: string;
}

/**
 * Represents the primary client for interacting with the Sindri ZKP service API. This class serves
 * as the central entry point for the SDK, facilitating various operations such as compiling ZKP
 * circuits and generating proofs.
 *
 * The {@link SindriClient} class encapsulates all the necessary methods and properties required to
 * communicate effectively with the Sindri ZKP service, handling tasks like authentication, request
 * management, and response processing.
 *
 * Usage of this class typically involves instantiating it with appropriate authentication options
 * and then utilizing its methods to interact with the service.
 *
 * @example
 * // Create an instance of the `SindriClient` class.
 * const client = new SindriClient({ apiKey: 'your-api-key' });
 *
 * // Use the client to interact with the Sindri ZKP service...
 */
export class SindriClient {
  /**
   * Represents the polling interval in milliseconds used for querying the status of an endpoint.
   * This value determines the frequency at which the SDK polls an endpoint to check for any changes
   * in status.
   *
   * The choice of polling interval is critical for balancing responsiveness against resource
   * consumption.  A shorter interval leads to more frequent updates, beneficial for
   * rapidly-changing statuses, but at the expense of higher network and computational load. In
   * contrast, a longer interval reduces resource usage but may delay the detection of status
   * changes.
   *
   * For more complex ZKP circuits, which may take longer to compile, considering a larger polling
   * interval could be advantageous. This approach minimizes unnecessary network traffic and
   * computational effort while awaiting the completion of these time-intensive operations.
   *
   * The default value is set to 1000 milliseconds (1 second), offering a general balance. However,
   * it can and should be adjusted based on the expected complexity and compilation time of the
   * circuits being processed.
   */
  public pollingInterval: number = 1000;

  /**
   * Constructs a new instance of the {@link SindriClient} class for interacting with the Sindri ZKP
   * service.  This constructor initializes the client with the necessary authentication options.
   *
   * The provided `authOptions` parameter allows for specifying authentication credentials and
   * configurations required for the client to communicate securely with the service.  See
   * {@link SindriClient.authorize} for more details about how authentication credentials are sourced.
   *
   * @param authOptions - The authentication options for the client, including
   * credentials like API keys or tokens. Defaults to an empty object if not provided.
   *
   * @example
   * // Instantiating the SindriClient with authentication options
   * const client = new SindriClient({ apiKey: 'sindri-...-fskd' });
   *
   * @see {@link SindriClient.authorize} for information on retrieving this value.
   */
  constructor(authOptions: AuthOptions = {}) {
    this.authorize(authOptions);
  }

  /**
   * Retrieves the current value of the client's API key used for authenticating with the Sindri ZKP
   * service.  This property is crucial for ensuring secure communication with the API and is
   * typically set during client initialization.
   *
   * If the API key is not set or is in an invalid format (not a string), this getter returns
   * `null`.  Proper management of the API key is essential for the security and proper functioning
   * of the SDK.
   *
   * @returns The current API key if set and valid, otherwise `null`.
   *
   * @example
   * const currentApiKey = client.apiKey;
   * if (currentApiKey) {
   *   console.log('API Key is set.');
   * } else {
   *   console.log('API Key is not set or is invalid.');
   * }
   */
  get apiKey(): string | null {
    if (OpenAPI.TOKEN && typeof OpenAPI.TOKEN !== "string") {
      return null;
    }
    return OpenAPI.TOKEN || null;
  }

  /**
   * Retrieves the current base URL of the Sindri ZKP service that the client is configured to
   * interact with.  This URL forms the foundation of all API requests made by the client and is
   * typically set during client initialization. Anyone other than employees at Sindri can typically
   * ignore this and use the default value of `https://sindri.app`.
   *
   * @returns The current base URL of the Sindri ZKP service.
   *
   * @example
   * console.log(`Current base URL: ${client.baseUrl}`);
   */
  get baseUrl(): string {
    return OpenAPI.BASE;
  }

  /** Retrieves the current log level of the client. The log level determines the verbosity of logs
   * produced by the client which can be crucial for debugging and monitoring the client's
   * interactions with the Sindri ZKP service.
   *
   * @returns The current log level of the client.
   *
   * @example
   * console.log(`Current log level: ${client.logLevel}`);
   */
  get logLevel(): LogLevel {
    // We don't specify any custom log levels, so we can narrow the type to exclude strings.
    return logger.level as LogLevel;
  }

  /**
   * Sets the client's log level. This level determines the verbosity of logs produced by the
   * client, allowing for flexible control over the amount of information logged during operation.
   *
   * @param level - The new log level to set for the client.
   *
   * @example
   * // Set log level to debug.
   * client.logLevel = "debug";
   */
  set logLevel(level: LogLevel) {
    logger.level = level;
  }

  /**
   * Authorizes the client with the Sindri ZKP service using the provided authentication options.
   * This method is called automatically after initializing a client, but you may call it again if
   * you would like to change the credentials. The logic around how credentials is as follows:
   *
   * 1. Any explicitly specified options in `authOptions` are always used if provided.
   * 2. The `SINDRI_API_KEY` and `SINDRI_BASE_URL` environment variables are checked next.
   * 3. The settings in `sindri.conf.json` (produced by running `sindri login` on the command-line) will be checked after that.
   * 4. Finally, the default value of `https://sindri.app` will be used for the base URL (this is
   * typically what you want unless you're an employee at Sindri). The API key will remain unset and
   * you will only be able to make requests that allow anonymous access.
   *
   *
   * @param authOptions - The authentication details required to authorize the client.
   * @returns True if authorization is successful, false otherwise.
   *
   * @example
   * const authOptions = { apiKey: 'sindri-...-jskd' };
   * const isAuthorized = client.authorize(authOptions);
   * if (isAuthorized) {
   *   console.log('Client is fully authorized.');
   * } else {
   *   console.log('Client is not authorized.');
   * }
   */
  authorize(authOptions: AuthOptions): boolean {
    if (process.env.BROWSER_BUILD) {
      OpenAPI.BASE = authOptions.baseUrl || "https://sindri.app";
      OpenAPI.TOKEN = authOptions.apiKey;
    } else {
      const config = loadConfig();
      OpenAPI.BASE =
        authOptions.baseUrl ||
        process.env.SINDRI_BASE_URL ||
        config.auth?.baseUrl ||
        OpenAPI.BASE ||
        "https://sindri.app";
      OpenAPI.TOKEN =
        authOptions.apiKey || process.env.SINDRI_API_KEY || config.auth?.apiKey;
    }
    return !!(OpenAPI.BASE && OpenAPI.TOKEN);
  }

  // }[tags=["latest"]]

  /**
   * Asynchronously creates and deploys a new circuit, initiating its compilation process.  This
   * method is essential for submitting new versions of circuits to the Sindri ZKP service for
   * compilation. Upon deployment, it continuously polls the service to track the compilation status
   * until the process either completes successfully or fails.
   *
   * The method accepts two parameters: `project` and `tags`. The `project` parameter can be either
   * a string representing the path to the project or an array of files (browser or Node.js file
   * objects) constituting the circuit. The `tags` parameter is used to assign tags to the deployed
   * circuit, facilitating versioning and identification. By default, the circuit is tagged as
   * "latest".
   *
   * After successful deployment and compilation, the method returns a `CircuitInfoResponse` object,
   * which includes details about the compiled circuit, such as its identifier and status.
   *
   * @param project - In Node.js, this can either be a path to the root
   * directory of a Sindri project, the path to a gzipped tarball containing the project, or an
   * array of `buffer.File` objects. In a web browser, it can only be an array of `File` objects.
   * @param tags - The list of tags, or singular tag if a string is passed, that
   * should be associated with the deployed circuit. Defaults to `["latest"]`. Specify an empty
   * array to indicate that you don't care about the compilation outputs and just want to see if it
   * the circuit will compile.
   * @returns A promise which resolves to the details of the deployed circuit.
   *
   * @example
   * // Deploy a circuit with a project identifier and default `latest` tag.
   * const circuit = await client.createCircuit("/path/to/circuit-directory/");
   * console.log("Did circuit compilation succeed?", circuit.status);
   *
   * @example
   * // Deploy a circuit with files and custom tags.
   * await client.createCircuit([file1, file2], ['v1.0', 'experimental']);
   */
  async createCircuit(
    project: string | Array<BrowserFile | NodeFile>,
    tags: string | string[] | null = ["latest"],
  ): Promise<CircuitInfoResponse> {
    const formData = new FormData();

    // First, validate the tags and them to the form data.
    tags = typeof tags === "string" ? [tags] : tags ?? [];
    for (const tag of tags) {
      if (!/^[-a-zA-Z0-9_]+$/.test(tag)) {
        throw new Error(
          `"${tag}" is not a valid tag. Tags may only contain alphanumeric characters, ` +
            "underscores, and hyphens.",
        );
      }
      formData.append("tags", tag);
    }
    if (tags.length === 0) {
      formData.append("tags", "");
    }

    // Handle `project` being a file or directory path.
    if (typeof project === "string") {
      if (process.env.BROWSER_BUILD) {
        throw new Error(
          "Specifying `project` as a path is not allowed in the browser build.",
        );
      }

      let projectStats;
      try {
        projectStats = await stat(project);
      } catch {
        throw new Error(
          `The "${project}" path does not exist or you do not have permission to access it.`,
        );
      }

      // If `project` is a path, then it's a prepackaged tarball.
      if (projectStats.isFile()) {
        if (!/\.(zip|tar|tar\.gz|tgz)$/i.test(project)) {
          throw new Error("Only gzipped tarballs or zip files are supported.");
        }
        const tarballFilename = path.basename(project);
        const tarballContent = await readFile(project);
        (formData as NodeFormData).append(
          "files",
          new File([tarballContent], tarballFilename),
        );

        // If `project` is a directory, then we need to bundle it.
      } else if (projectStats.isDirectory()) {
        const sindriJsonPath = path.join(project, "sindri.json");
        let sindriJsonContent;
        try {
          sindriJsonContent = await readFile(sindriJsonPath, {
            encoding: "utf-8",
          });
        } catch {
          throw new Error(
            `Expected Sindri manifest file at "${sindriJsonPath}" does not exist.`,
          );
        }
        let sindriJson;
        try {
          sindriJson = JSON.parse(sindriJsonContent) as { name: string };
        } catch {
          throw new Error(
            `Could not parse "${sindriJsonPath}", is it valid JSON?`,
          );
        }
        const circuitName = sindriJson?.name;
        if (!circuitName) {
          throw new Error(
            `No circuit "name" field was found in "${sindriJsonPath}", the manifest is invalid.`,
          );
        }

        // Create a tarball with all the files that should be included from the project.
        const files = walk
          .sync({
            follow: true,
            ignoreFiles: [".sindriignore"],
            path: project,
          })
          .filter(
            (file) =>
              // Always exclude `.git` subdirectories.
              !/(^|\/)\.git(\/|$)/.test(file),
          );
        // Always include the `sindri.json` file.
        const sindriJsonFilename = path.basename(sindriJsonPath);
        if (!files.includes(sindriJsonFilename)) {
          files.push(sindriJsonFilename);
        }
        const tarballFilename = `${circuitName}.tar.gz`;
        files.sort((a, b) => a.localeCompare(b)); // Deterministic for tests.
        const tarStream = tar.c(
          {
            cwd: project,
            gzip: true,
            onwarn: (code: string, message: string) => {
              logger.warn(`While creating tarball: ${code} - ${message}`);
            },
            prefix: `${circuitName}/`,
            sync: true,
          },
          files,
          // This works around a bug in the typing of `tar` when using `sync`.
        ) as unknown as Readable;

        // Add the tarball to the form data.
        (formData as NodeFormData).append(
          "files",
          new File([tarStream.read()], tarballFilename),
        );
      } else {
        throw new Error(`The "${project}" path is not a file or directory.`);
      }

      // Handle an array of files.
    } else if (Array.isArray(project)) {
      // Validate the file array.
      if (!project.every((file) => file instanceof File)) {
        throw new Error("All entries in `project` must be `File` instances.");
      }
      const sindriJsonFile = project.find(
        (file) => file.name === "sindri.json",
      );
      if (!sindriJsonFile) {
        throw new Error(
          "The `project` array must include a `sindri.json` file.",
        );
      }
      let sindriJson;
      try {
        sindriJson = JSON.parse(await sindriJsonFile.text()) as {
          name: string;
        };
      } catch {
        throw new Error(`Could not parse "sindri.json", is it valid JSON?`);
      }
      const circuitName = sindriJson?.name;
      if (!circuitName) {
        throw new Error(
          `No circuit "name" field was found in "sindri.json", the manifest is invalid.`,
        );
      }

      // Create the gzipped tarball.
      const tarball = new Tar();
      project.sort((a, b) => a.name.localeCompare(b.name)); // Deterministic for tests.
      for (const file of project) {
        const content = new Uint8Array(await file.arrayBuffer());
        await new Promise((resolve) =>
          tarball.append(`${circuitName}/${file.name}`, content, resolve),
        );
      }
      const gzippedTarball = new Uint8Array(gzip.zip(tarball.out));
      const tarFile = new File([gzippedTarball], `${circuitName}.tar.gz`);

      // Append the tarball to the form data.
      // These lines are functionally identical, but we want to typecheck node and browser.
      if (process.env.BROWSER_BUILD) {
        (formData as BrowserFormData).append("files", tarFile as BrowserFile);
      } else {
        (formData as NodeFormData).append("files", tarFile as NodeFile);
      }
    }

    // We need to shuffle in a hard-coded form boundary for tests to be deterministic.
    // Note that it's import the boundary matches the Chrome format because the test runner checks
    // payloads for this format in order to compare non-deterministic gzips.
    // TODO: These header changes are global, we need to make them local to this request.
    const oldHeaders = OpenAPI.HEADERS;
    OpenAPI.HEADERS = {
      "Content-Type":
        "multipart/form-data; boundary=----WebKitFormBoundary0buQ8d6EhWcs9X9d",
    };
    const createResponsePromise = CircuitsService.circuitCreate(
      formData as NodeFormData,
    );
    const createResponse = await createResponsePromise;
    OpenAPI.HEADERS = oldHeaders;
    const circuitId = createResponse.circuit_id;

    let response: CircuitInfoResponse;
    while (true) {
      response = await CircuitsService.circuitDetail(circuitId, false);
      if (response.status === "Ready" || response.status === "Failed") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));
    }
    return response;
  }

  /**
   * Retrieves all proofs associated with a specified circuit.  This method is essential for
   * obtaining a comprehensive list of proofs generated for a given circuit, identified by its
   * unique circuit ID. It returns an array of `ProofInfoResponse` objects, each representing a
   * proof associated with the circuit.
   *
   * The method is particularly useful in scenarios where tracking or auditing all proofs of a
   * circuit is necessary. This could include verifying the integrity of proofs, understanding their
   * usage, or simply enumerating them for record-keeping.
   *
   * The `circuitId` parameter is a string that uniquely identifies the circuit in question. It's
   * crucial to provide the correct circuit ID to retrieve the corresponding proofs accurately.
   *
   * @param circuitId - The unique identifier of the circuit for which proofs are to be retrieved.
   * @returns A promise that resolves to an array of details for each associated proof.
   *
   * @example
   * const proofs = await client.getAllCircuitProofs(circuitId);
   * console.log("Proofs:', proofs);
   */
  async getAllCircuitProofs(circuitId: string): Promise<ProofInfoResponse[]> {
    return await CircuitsService.circuitProofs(circuitId);
  }

  /**
   * Retrieves all circuits associated with the team.  This method fetches a list of all circuits
   * that have been created or accessed by the currently authenticated team. It's a key method for
   * managing and monitoring circuit usage within a team, offering insights into the variety and
   * scope of circuits in use.
   *
   * @returns A promise that resolves to an array of circuit information responses.
   *
   * @example
   * const circuits = await = client.getAllCircuits();
   * console.log("Circuits:", circuits);
   */
  async getAllCircuits(): Promise<CircuitInfoResponse[]> {
    return await CircuitsService.circuitList();
  }

  /**
   * Retrieves all proofs associated with the team.  This method is designed to fetch a list of all
   * proofs generated by the current team across all circuits, providing a holistic view of the
   * team's activities in proof generation and management.
   *
   * Utilizing this method helps in gaining insights into the proofs created, their status, and
   * other relevant details, which is essential for effective team-wide proof tracking and auditing.
   * It returns a promise that resolves to an array of {@link ProofInfoResponse} objects, where each
   * object encapsulates detailed information about a specific proof.
   *
   * @returns A promise that resolves to an array of proofs.
   *
   * @example
   * const proofs = await clientgetAllProofs()
   * console.log("How many proofs?", proofs.length);
   */
  async getAllProofs(): Promise<ProofInfoResponse[]> {
    return await ProofsService.proofList();
  }

  /**
   * Retrieves a specific circuit using its unique circuit ID.  This method is crucial for obtaining
   * detailed information about a particular circuit,  identified by the provided `circuitId`. It's
   * especially useful when detailed insights  or operations on a single circuit are required, rather
   * than handling multiple circuits.
   *
   * *Note:* In case the provided `circuitId` is invalid or does not correspond to an existing circuit,
   * the promise may reject, indicating an error. Proper error handling is therefore essential when using this method.
   *
   * @param circuitId - The unique identifier of the circuit to retrieve.
   * @returns A promise that resolves to the information about the specified circuit.
   *
   * @example
   * const circuit = await client.getCircuit(circuitId);
   * console.log('Circuit details:', circuit);
   */
  async getCircuit(circuitId: string): Promise<CircuitInfoResponse> {
    return await CircuitsService.circuitDetail(circuitId);
  }

  /**
   * Retrieves detailed information about a specific proof, identified by its unique proof ID.  This
   * method is vital for obtaining individual proof details, facilitating in-depth analysis or
   * verification of a particular proof within the system.
   *
   * The `proofId` parameter is the key identifier for the proof, and it should be provided to fetch
   * the corresponding information. The method returns a promise that resolves to a
   * {@link ProofInfoResponse}, containing all relevant details of the proof.
   *
   * @param proofId - The unique identifier of the proof to retrieve.
   * @returns A promise that resolves to the data about the specified proof.
   *
   * @example
   * const proof = await client.getProof(proofId);
   * console.log("Proof details:", proof);
   */
  async getProof(proofId: string): Promise<ProofInfoResponse> {
    return await ProofsService.proofDetail(proofId);
  }

  /**
   * Generates a proof for a specified circuit.  This method is critical for creating a new proof
   * based on a given circuit, identified by `circuitId`, and the provided `proofInput`. It's
   * primarily used to validate or verify certain conditions or properties of the circuit without
   * revealing underlying data or specifics. The method continuously polls the service to track the
   * compilation status until the process either completes successfully or fails.
   *
   * The `circuitId` parameter specifies the unique identifier of the circuit for which the proof is
   * to be generated.  The `proofInput` is a string that represents the necessary input data or
   * parameters required for generating the proof.
   *
   * @param circuitId - The unique identifier of the circuit for which the proof is being generated.
   * @param proofInput - The input data required for generating the proof. This should be a string
   * containing either JSON data or TOML data (in the case of Noir).
   * @returns A promise that resolves to the information of the generated proof.
   *
   * @example
   * const proof = await client.proveCircuit(circuitId, '{"X": 23, "Y": 52}');
   * console.log("Generated proof:", proof);
   */
  async proveCircuit(
    circuitId: string,
    proofInput: string,
  ): Promise<ProofInfoResponse> {
    const createResponse = await CircuitsService.proofCreate(circuitId, {
      proof_input: proofInput,
    });
    let response: ProofInfoResponse;
    while (true) {
      response = await ProofsService.proofDetail(createResponse.proof_id);
      if (response.status === "Ready" || response.status === "Failed") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));
    }
    return response;
  }
}
