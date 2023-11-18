/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { Halo2CircuitType } from "./Halo2CircuitType";

/**
 * Response for getting Halo2 circuit info.
 */
export type Halo2CircuitInfoResponse = {
  circuit_id: string;
  circuit_name: string;
  date_created: string;
  status: CircuitStatus;
  compute_time?: number;
  compute_times?: any;
  file_sizes?: Record<string, any>;
  metadata?: Record<string, any>;
  system_info?: Record<string, any>;
  verification_key?: Record<string, any>;
  error?: string;
  circuit_type: Halo2CircuitType;
  curve?: string;
  degree?: number;
  trusted_setup_file?: string;
  halo2_base_version?: string;
};
