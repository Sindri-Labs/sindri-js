/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { BoojumCircuitInfoResponse } from "./BoojumCircuitInfoResponse";
import type { CircomCircuitInfoResponse } from "./CircomCircuitInfoResponse";
import type { GnarkCircuitInfoResponse } from "./GnarkCircuitInfoResponse";
import type { Halo2CircuitInfoResponse } from "./Halo2CircuitInfoResponse";
import type { HermezCircuitInfoResponse } from "./HermezCircuitInfoResponse";
import type { JoltCircuitInfoResponse } from "./JoltCircuitInfoResponse";
import type { NoirCircuitInfoResponse } from "./NoirCircuitInfoResponse";
import type { OpenvmCircuitInfoResponse } from "./OpenvmCircuitInfoResponse";
import type { Plonky2CircuitInfoResponse } from "./Plonky2CircuitInfoResponse";
import type { SnarkvmCircuitInfoResponse } from "./SnarkvmCircuitInfoResponse";
import type { Sp1CircuitInfoResponse } from "./Sp1CircuitInfoResponse";

/**
 * Response for getting circuit info.
 */
export type CircuitInfoResponse =
  | BoojumCircuitInfoResponse
  | CircomCircuitInfoResponse
  | Halo2CircuitInfoResponse
  | HermezCircuitInfoResponse
  | GnarkCircuitInfoResponse
  | JoltCircuitInfoResponse
  | NoirCircuitInfoResponse
  | OpenvmCircuitInfoResponse
  | Plonky2CircuitInfoResponse
  | SnarkvmCircuitInfoResponse
  | Sp1CircuitInfoResponse;
