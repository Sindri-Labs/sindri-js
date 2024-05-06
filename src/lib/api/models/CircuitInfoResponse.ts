/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { BoojumCircuitInfoResponse } from "./BoojumCircuitInfoResponse";
import type { CircomCircuitInfoResponse } from "./CircomCircuitInfoResponse";
import type { GnarkCircuitInfoResponse } from "./GnarkCircuitInfoResponse";
import type { Halo2CircuitInfoResponse } from "./Halo2CircuitInfoResponse";
import type { NoirCircuitInfoResponse } from "./NoirCircuitInfoResponse";

/**
 * Response for getting circuit info.
 */
export type CircuitInfoResponse =
  | BoojumCircuitInfoResponse
  | CircomCircuitInfoResponse
  | Halo2CircuitInfoResponse
  | GnarkCircuitInfoResponse
  | NoirCircuitInfoResponse;
