/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JobStatus } from "./JobStatus";

/**
 * Response for getting Circom circuit info.
 */
export type CircomCircuitInfoResponse = {
  /**
   * A unique identifier generated for the circuit. UUID4 format.
   */
  circuit_id: string;
  /**
   * The name of a circuit. This can be used in place of circuit_id for proving. This is specified during creation in the included sindri.json file.
   */
  circuit_name: string;
  /**
   * The development framework used to write the circuit. This is specified during creation in the included sindri.json file.
   */
  circuit_type: "circom";
  /**
   * The UTC datetime the circuit was uploaded in ISO8601 format.
   */
  date_created: string;
  /**
   * The number of proofs submitted for this circuit.
   */
  num_proofs: number;
  /**
   * The proving scheme for this circuit. This is specified during creation in the included sindri.json file.
   */
  proving_scheme: string;
  /**
   * The status of the circuit job.
   */
  status: JobStatus;
  /**
   * The user/team that owns this circuit.
   */
  team: string;
  /**
   * Total compute time in ISO8601 format.
   */
  compute_time?: number;
  /**
   * Total compute time in seconds.
   */
  compute_time_sec?: number;
  /**
   * Detailed compute times for the circuit compilation.
   */
  compute_times?: any;
  /**
   * Total size of stored file(s) in bytes.
   */
  file_size?: number;
  /**
   * Queue time in ISO8601 format.
   */
  queue_time?: number;
  /**
   * Queue time in seconds.
   */
  queue_time_sec?: number;
  /**
   * The name of the uploaded circuit file. Note: the CLI and SDKs create a generic name when a directory is specified for upload.
   */
  uploaded_file_name: string;
  /**
   * The verification key of this circuit.
   */
  verification_key?: Record<string, any>;
  /**
   * The error message for a failed circuit upload.
   */
  error?: string;
  /**
   * The elliptic curve over which the proving protocol takes place.
   */
  curve: string;
  /**
   * The number of constraints in the Rank-1 Constraint System (R1CS) of the circuit.
   */
  num_constraints?: number;
  /**
   * The number of public outputs from the circuit.
   */
  num_outputs?: number;
  /**
   * The number of private inputs for the circuit.
   */
  num_private_inputs?: number;
  /**
   * The number of public inputs for the circuit.
   */
  num_public_inputs?: number;
};
