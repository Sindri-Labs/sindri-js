/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to fetch a proof with proof_id.
 * Error: Proof with proof_id does not exist.
 */
export type ProofDoesNotExistResponse = {
  error: string;
  exception_id?: string;
  message: string;
  proof_id: string;
};
