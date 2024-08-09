/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CircuitType } from "./CircuitType";
import type { JobStatus } from "./JobStatus";

/**
 * Response for a project's latest circuit.
 */
export type ProjectLatestCircuitResponse = {
  /**
   * A unique identifier generated for the circuit. UUID4 format.
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
   * The proving scheme for this circuit. This is specified during creation in the included sindri.json file.
   */
  proving_scheme: string;
  /**
   * The status of the circuit job.
   */
  status: JobStatus;
};
