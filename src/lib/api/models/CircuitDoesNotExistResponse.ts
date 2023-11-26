/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to fetch a circuit with circuit_id.
 * Error: A circuit with circuit_id does not exist.
 */
export type CircuitDoesNotExistResponse = {
  error: string;
  circuit_id: string;
  message: string;
};
