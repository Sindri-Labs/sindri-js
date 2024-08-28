/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Client input when creating a circuit.
 */
export type CircuitCreateInput = {
  /**
   * An arbitrary mapping of metadata keys to string values. This can be used to track additional information about the circuit such as an ID from an external system.
   */
  meta?: Record<string, string>;
  /**
   * Tags for a circuit.
   */
  tags?: Array<string>;
};
