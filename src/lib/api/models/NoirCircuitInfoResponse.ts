/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { CircuitType } from "./CircuitType";

/**
 * Response for getting Noir circuit info.
 */
export type NoirCircuitInfoResponse = {
  circuit_id: string;
  circuit_name: string;
  circuit_type: CircuitType;
  date_created: string;
  proving_scheme: string;
  status: CircuitStatus;
  compute_time?: number;
  compute_times?: any;
  file_sizes?: Record<string, any>;
  metadata?: Record<string, any>;
  uploaded_file_name: string;
  worker_hardware?: Record<string, any>;
  verification_key?: Record<string, any>;
  error?: string;
  acir_opcodes?: number;
  circuit_size?: number;
  nargo_package_name: string;
};
