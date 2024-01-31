/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JobStatus } from "./JobStatus";

/**
 * Response for getting Noir circuit info.
 */
export type NoirCircuitInfoResponse = {
  circuit_id: string;
  circuit_name: string;
  circuit_type: "noir";
  date_created: string;
  num_proofs: number;
  proving_scheme: string;
  status: JobStatus;
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
  acir_opcodes?: number;
  circuit_size?: number;
  nargo_package_name: string;
};
