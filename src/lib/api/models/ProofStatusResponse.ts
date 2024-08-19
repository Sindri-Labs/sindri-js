/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JobStatus } from "./JobStatus";

/**
 * Response for getting proof status.
 */
export type ProofStatusResponse = {
  /**
   * A unique identifier generated for the proof. UUID4 format.
   */
  proof_id: string;
  /**
   * The status of the proof job.
   */
  status: JobStatus;
};
