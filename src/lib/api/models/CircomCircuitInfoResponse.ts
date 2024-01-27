/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { CircuitType } from "./CircuitType";

/**
 * Response for getting Circom circuit info.
 */
export type CircomCircuitInfoResponse = {
  circuit_id: string;
  circuit_name: string;
  circuit_type: CircuitType;
  date_created: string;
  num_proofs: number;
  proving_scheme: string;
  status: CircuitStatus;
  team: string;
  /**
   * Total compute time in ISO8601 format. This does not include the Queued time.
   */
  compute_time?: number;
  /**
   * Total compute time in seconds. This does not include the Queued time.
   */
  compute_time_sec?: number;
  compute_times?: any;
  /**
   * Total size of stored file(s) in bytes.
   */
  file_size?: number;
  uploaded_file_name: string;
  verification_key?: Record<string, any>;
  error?: string;
  curve: string;
  num_constraints?: number;
  num_outputs?: number;
  num_private_inputs?: number;
  num_public_inputs?: number;
};
