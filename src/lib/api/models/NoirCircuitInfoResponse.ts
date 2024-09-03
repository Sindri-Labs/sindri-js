/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JobStatus } from "./JobStatus";

/**
 * Response for getting Noir circuit info.
 */
export type NoirCircuitInfoResponse = {
  /**
   * A unique identifier generated for the circuit. UUID4 format.
   */
  circuit_id: string;
  /**
   * @deprecated
   */
  circuit_name: string;
  /**
   * The name of the project. This can be used in place of circuit_id for proving. This is specified during creation in the included sindri.json file. If the project is renamed, this will be the new name of the project, not the original name that was included in the sindri.json file.
   */
  project_name: string;
  /**
   * The development framework used to write the circuit. This is specified during creation in the included sindri.json file.
   */
  circuit_type: "noir";
  /**
   * The UTC datetime the circuit was uploaded in ISO8601 format.
   */
  date_created: string;
  /**
   * Metadata keys and values for the circuit that were specified at creation time.
   */
  meta: Record<string, string>;
  /**
   * The number of proofs submitted for this circuit.
   */
  num_proofs: number | null;
  /**
   * The proving scheme for this circuit. This is specified during creation in the included sindri.json file.
   */
  proving_scheme: string;
  /**
   * Whether the circuit is public. Public circuits can be used by any user.
   */
  public: boolean;
  /**
   * The status of the circuit job.
   */
  status: JobStatus;
  /**
   * Tags for the circuit.
   */
  tags: Array<string>;
  /**
   * The name of the team that owns this circuit.
   */
  team: string;
  /**
   * URL for the avatar image of the team that owns this circuit.
   */
  team_avatar_url: string;
  /**
   * The slug of the team that owns this circuit.
   */
  team_slug: string;
  /**
   * Total compute time in ISO8601 format.
   */
  compute_time: string | null;
  /**
   * Total compute time in seconds.
   */
  compute_time_sec: number | null;
  /**
   * Detailed compute times for the circuit compilation.
   */
  compute_times: null;
  /**
   * Total size of stored file(s) in bytes.
   */
  file_size: number | null;
  /**
   * Queue time in ISO8601 format.
   */
  queue_time: string | null;
  /**
   * Queue time in seconds.
   */
  queue_time_sec: number | null;
  /**
   * The name of the uploaded circuit file. Note: the CLI and SDKs create a generic name when a directory is specified for upload.
   */
  uploaded_file_name: string;
  /**
   * Boolean indicating whether this circuit has a smart contract verifier available.
   */
  has_smart_contract_verifier: boolean;
  /**
   * Boolean indicating whether this circuit has a verification key available.
   */
  has_verification_key: boolean;
  /**
   * The verification key of this circuit.
   */
  verification_key: Record<string, any> | null;
  /**
   * A list of runtime warnings with UTC timestamps.
   */
  warnings: Array<string> | null;
  /**
   * The error message for a failed circuit upload.
   */
  error: string | null;
  /**
   * The number of opcodes in the intermediate representation.
   */
  acir_opcodes: number | null;
  /**
   * The number of constraints with an instantiated proving backend in the circuit.
   */
  circuit_size: number | null;
  /**
   * The elliptic curve over which the proving protocol takes place.
   */
  curve: string;
  /**
   * The name of the circuit project specified in the included Nargo.toml file.
   */
  nargo_package_name: string;
  /**
   * The Noir frontend version tag.
   */
  noir_version: string;
};
