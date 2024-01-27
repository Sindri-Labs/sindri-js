/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitType } from "./CircuitType";
import type { ProofStatus } from "./ProofStatus";

/**
 * Response for getting proof info.
 */
export type ProofInfoResponse = {
  proof_id: string;
  circuit_name: string;
  circuit_id: string;
  circuit_type: CircuitType;
  date_created: string;
  perform_verify: boolean;
  status: ProofStatus;
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
  proof_input?: Record<string, any>;
  proof?: Record<string, any>;
  public?: any;
  verification_key?: Record<string, any>;
  error?: string;
};
