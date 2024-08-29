/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JobStatus } from "./JobStatus";

/**
 * Client input for filtering proofs.
 */
export type ProofListInput = {
  /**
   * Return proofs created after this date.
   */
  date_created_after?: string | null;
  /**
   * Return proofs created before this date.
   */
  date_created_before?: string | null;
  /**
   * Return proofs with this job status.
   */
  status?: JobStatus | null;
};
