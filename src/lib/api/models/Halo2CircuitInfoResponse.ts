/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitStatus } from "./CircuitStatus";
import type { CircuitType } from "./CircuitType";

/**
 * Response for getting Halo2 circuit info.
 */
export type Halo2CircuitInfoResponse = {
  circuit_id: string;
  circuit_type: CircuitType;
  circuit_name: string;
  date_created: string;
  status: CircuitStatus;
  compute_time?: number;
  compute_times?: any;
  file_sizes?: Record<string, any>;
  metadata?: Record<string, any>;
  uploaded_file_name: string;
  worker_hardware?: Record<string, any>;
  verification_key?: Record<string, any>;
  error?: string;
  class_name: string;
  curve: string;
  degree: number;
  halo2_version: string;
  package_name: string;
  thread_builder: string;
  trusted_setup_file: string;
};
