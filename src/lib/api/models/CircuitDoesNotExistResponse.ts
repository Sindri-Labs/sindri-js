/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to fetch a circuit with circuit_name.
 * Error: A circuit with circuit_name does not exist.
 */
export type CircuitDoesNotExistResponse = {
  error: string;
  circuit_id: string;
  message: string;
};
