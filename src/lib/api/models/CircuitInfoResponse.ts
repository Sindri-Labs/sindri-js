/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { BoojumCircuitInfoResponse } from "./BoojumCircuitInfoResponse";
import type { CircomCircuitInfoResponse } from "./CircomCircuitInfoResponse";
import type { GnarkCircuitInfoResponse } from "./GnarkCircuitInfoResponse";
import type { Halo2CircuitInfoResponse } from "./Halo2CircuitInfoResponse";
import type { JoltCircuitInfoResponse } from "./JoltCircuitInfoResponse";
import type { NoirCircuitInfoResponse } from "./NoirCircuitInfoResponse";
import type { Plonky2CircuitInfoResponse } from "./Plonky2CircuitInfoResponse";

/**
 * Response for getting circuit info.
 */
export type CircuitInfoResponse =
  | BoojumCircuitInfoResponse
  | CircomCircuitInfoResponse
  | Halo2CircuitInfoResponse
  | GnarkCircuitInfoResponse
  | JoltCircuitInfoResponse
  | NoirCircuitInfoResponse
  | Plonky2CircuitInfoResponse;
