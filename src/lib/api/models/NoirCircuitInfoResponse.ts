/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { NoirCircuitType } from "./NoirCircuitType";

/**
 * Response for getting Noir circuit info.
 */
export type NoirCircuitInfoResponse = {
  circuit_id: string;
  circuit_name: string;
  date_created: string;
  status: CircuitStatus;
  compute_time?: number;
  compute_times?: any;
  file_sizes?: Record<string, any>;
  metadata?: Record<string, any>;
  worker_hardware?: Record<string, any>;
  verification_key?: Record<string, any>;
  error?: string;
  circuit_type: NoirCircuitType;
  nargo_package_name?: string;
  acir_opcodes?: number;
  circuit_size?: number;
};
