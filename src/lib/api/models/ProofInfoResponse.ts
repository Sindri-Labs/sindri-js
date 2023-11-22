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
  compute_time?: number;
  compute_times?: any;
  file_sizes?: Record<string, any>;
  metadata?: Record<string, any>;
  proof_input?: Record<string, any>;
  proof?: Record<string, any>;
  prover_implementation?: Record<string, any>;
  public?: any;
  worker_hardware?: Record<string, any>;
  verification_key?: Record<string, any>;
  error?: string;
};
