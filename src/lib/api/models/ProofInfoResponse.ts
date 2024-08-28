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
   * @deprecated
   */
  circuit_name: string;
  /**
   * The name of the project associated with this proof.
   */
  project_name: string;
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
   * Metadata keys and values for the proof that were specified at creation time.
   */
  meta: Record<string, string>;
  /**
   * A boolean indicating whether an internal verification check occurred during the proof creation.
   */
  perform_verify: boolean;
  /**
   * The status of the proof job.
   */
  status: JobStatus;
  /**
   * The name of the team that owns this proof.
   */
  team: string;
  /**
   * URL for the avatar image of the team that owns this proof.
   */
  team_avatar_url: string;
  /**
   * The slug of the team that owns this proof.
   */
  team_slug: string;
  /**
   * The name of the team that owns the circuit associated with this proof.
   */
  circuit_team: string;
  /**
   * URL for the avatar image of the team that owns the circuit associated with this proof.
   */
  circuit_team_avatar_url: string;
  /**
   * The slug of the team that owns the circuit associated with this proof.
   */
  circuit_team_slug: string;
  /**
   * Total compute time in ISO8601 format.
   */
  compute_time?: string | null;
  /**
   * Total compute time in seconds.
   */
  compute_time_sec?: number | null;
  /**
   * Detailed compute times for the proof generation.
   */
  compute_times?: null;
  /**
   * Total size of stored file(s) in bytes.
   */
  file_size?: number | null;
  /**
   * The succinct argument(s) of knowledge.
   */
  proof?: Record<string, any> | null;
  /**
   * The public outputs of the circuit.
   */
  public?: null;
  /**
   * Queue time in ISO8601 format.
   */
  queue_time?: string | null;
  /**
   * Queue time in seconds.
   */
  queue_time_sec?: number | null;
  /**
   * The proof and public formatted as calldata for the smart contract verifier.
   */
  smart_contract_calldata?: string | null;
  /**
   * Boolean indicating whether this proof has smart contract calldata available.
   */
  has_smart_contract_calldata?: boolean;
  /**
   * Boolean indicating whether this proof's circuit has a verification key available.
   */
  has_verification_key?: boolean;
  /**
   * The verification key of this circuit.
   */
  verification_key?: Record<string, any> | null;
  /**
   * A list of runtime warnings with UTC timestamps.
   */
  warnings?: Array<string> | null;
  /**
   * The error message for a failed proof.
   */
  error?: string | null;
};
