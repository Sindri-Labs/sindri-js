/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitType } from "./CircuitType";
import type { JobStatus } from "./JobStatus";

/**
 * Response for getting proof info.
 */
export type ProofInfoResponse = {
  /**
   * A unique identifier generated for the proof. UUID4 format.
   */
  proof_id: string;
  /**
   * The name of the circuit associated with this proof.
   */
  circuit_name: string;
  /**
   * The circuit_id of the circuit associated with this proof. UUID4 format.
   */
  circuit_id: string;
  /**
   * The development framework used to write the circuit. This is specified during creation in the included sindri.json file.
   */
  circuit_type: CircuitType;
  /**
   * The UTC datetime the circuit was uploaded in ISO8601 format.
   */
  date_created: string;
  /**
   * A boolean indicating whether an internal verification check occurred during the proof creation.
   */
  perform_verify: boolean;
  /**
   * The status of the proof job.
   */
  status: JobStatus;
  /**
   * The user/team that owns this circuit for this proof.
   */
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
  /**
   * The private/public inputs to the circuit.
   */
  proof_input?: Record<string, any>;
  /**
   * The succinct argument(s) of knowledge.
   */
  proof?: Record<string, any>;
  /**
   * The public outputs of the circuit.
   */
  public?: any;
  /**
   * The proof and public formatted as calldata for the smart contract verifier.
   */
  smart_contract_calldata?: string;
  /**
   * The verification key of this circuit.
   */
  verification_key?: Record<string, any>;
  /**
   * The error message for a failed proof.
   */
  error?: string;
};
