import { readFile, stat } from "fs/promises";
import path from "path";
import type { Readable } from "stream";

import gzip from "gzip-js";
import walk from "ignore-walk";
import tar from "tar";
import Tar from "tar-js";

import { CircuitsService, CircuitStatus, CircuitType, OpenAPI } from "lib/api";
import type {
  CircomCircuitInfoResponse,
  Halo2CircuitInfoResponse,
  GnarkCircuitInfoResponse,
  NoirCircuitInfoResponse,
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
export { CircuitStatus, CircuitType };
export type {
  CircomCircuitInfoResponse,
  GnarkCircuitInfoResponse,
  Halo2CircuitInfoResponse,
  NoirCircuitInfoResponse,
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
 * The client for the API.
 */
export class Client {
  /**
   * The amount of time in milliseconds to wait between requests when polling and endpoint for
   * changes in status.
   */
  public pollingInterval: number = 1000;

  /**
   * Create a new API client.
   */
  constructor(authOptions: AuthOptions = {}) {
    this.authorize(authOptions);
  }

  /**
   * The current value of the client's API key.
   */
  get apiKey(): string | null {
    if (OpenAPI.TOKEN && typeof OpenAPI.TOKEN !== "string") {
      return null;
    }
    return OpenAPI.TOKEN || null;
  }

  /**
   * The current value of the client's base URL.
   */
  get baseUrl(): string {
    return OpenAPI.BASE;
  }

  /**
   * The current value of the client's log level.
   */
  get logLevel(): LogLevel {
    // We don't specify any custom log levels, so we can narrow the type to exclude strings.
    return logger.level as LogLevel;
  }

  /**
   * Set the client's log level.
   */
  set logLevel(level: LogLevel) {
    logger.level = level;
  }

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

  async createCircuit(
    project: string | File[],
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
    // TODO: These header changes are global, we need to make them local to this request.
    const oldHeaders = OpenAPI.HEADERS;
    OpenAPI.HEADERS = {
      "Content-Type":
        "multipart/form-data; boundary=sindri-boundary-nej0g349v70WMJiIQ0qh-JiiC",
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
      if (
        response.status === CircuitStatus.READY ||
        response.status === CircuitStatus.FAILED
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, this.pollingInterval));
    }
    return response;
  }

  async listCircuits(): Promise<CircuitInfoResponse[]> {
    logger.debug("Requesting `/api/v1/circuit/list`.");
    return await CircuitsService.circuitList();
  }
}
