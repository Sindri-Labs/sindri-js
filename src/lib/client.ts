import {
  CircuitsService,
  OpenAPI,
  type CircomCircuitInfoResponse,
  type Halo2CircuitInfoResponse,
  type GnarkCircuitInfoResponse,
  type NoirCircuitInfoResponse,
} from "lib/api";
import { loadConfig } from "lib/config";
import { logger, LogLevel } from "lib/logging";

// Re-export types from the API.
export type {
  CircomCircuitInfoResponse,
  Halo2CircuitInfoResponse,
  GnarkCircuitInfoResponse,
  NoirCircuitInfoResponse,
};
export type CircuitInfoResponse = (
  | CircomCircuitInfoResponse
  | Halo2CircuitInfoResponse
  | GnarkCircuitInfoResponse
  | NoirCircuitInfoResponse
)[];

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
        OpenAPI.BASE ||
        process.env.SINDRI_BASE_URL ||
        config.auth?.baseUrl ||
        "https://sindri.app";
      OpenAPI.TOKEN =
        authOptions.apiKey ||
        OpenAPI.TOKEN ||
        process.env.SINDRI_API_KEY ||
        config.auth?.apiKey;
    }
    return !!(OpenAPI.BASE && OpenAPI.TOKEN);
  }

  async listCircuits(): Promise<CircuitInfoResponse> {
    logger.debug("Requesting `/api/v1/circuit/list`.");
    return await CircuitsService.circuitList();
  }
}
