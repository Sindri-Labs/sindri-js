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
  curve: string;
  degree?: number;
  num_constraints?: number;
  num_outputs?: number;
  num_private_inputs?: number;
  num_public_inputs?: number;
  num_wires?: number;
  trusted_setup_file: string;
  witness_compiler: string;
};
