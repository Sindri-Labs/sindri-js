/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { CircuitType } from "./CircuitType";

/**
 * Response for getting Gnark circuit info.
 */
export type GnarkCircuitInfoResponse = {
  circuit_id: string;
  circuit_type: CircuitType;
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
  circuit_struct_name: string;
  curve: string;
  gnark_version: string;
  package_name: string;
  proving_scheme: string;
};
