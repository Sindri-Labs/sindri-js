/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to prove with a non-ready circuit (not compiled)
 * Error: The circuit is not ready to accept proofs
 */
export type CircuitIsNotReadyResponse = {
  error: string;
  circuit_id: string;
  message?: string;
};
