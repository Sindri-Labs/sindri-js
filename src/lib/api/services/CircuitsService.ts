/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ActionResponse } from "../models/ActionResponse";
import type { CircuitInfoResponse } from "../models/CircuitInfoResponse";
import type { ProofInfoResponse } from "../models/ProofInfoResponse";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class CircuitsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Create Circuit
   * Create a circuit.
   * @param formData
   * @returns CircuitInfoResponse Created
   * @throws ApiError
   */
  public circuitCreate(
    formData: // This is a manual edit to allow `FormData` to be passed in directly:
    | FormData // DO NOT REMOVE THIS!
      | {
          files: Array<Blob>;
          /**
           * Tags for a circuit.
           */
          tags?: Array<string>;
        },
  ): CancelablePromise<CircuitInfoResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/circuit/create",
      formData: formData,
      mediaType: "multipart/form-data",
      errors: {
        412: `Precondition Failed`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Circuit List
   * Return a list of CircuitInfoResponse for circuits related to user.
   * @param includeVerificationKey
   * @returns CircuitInfoResponse OK
   * @throws ApiError
   */
  public circuitList(
    includeVerificationKey: boolean = false,
  ): CancelablePromise<Array<CircuitInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/list",
      query: {
        include_verification_key: includeVerificationKey,
      },
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Circuit Detail
   * Get info for existing circuit
   * @param circuitId
   * @param includeVerificationKey
   * @returns CircuitInfoResponse OK
   * @throws ApiError
   */
  public circuitDetail(
    circuitId: string,
    includeVerificationKey: boolean = true,
  ): CancelablePromise<CircuitInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/detail",
      path: {
        circuit_id: circuitId,
      },
      query: {
        include_verification_key: includeVerificationKey,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete Circuit
   * Mark the specified circuit and any related proofs as deleted.
   * @param circuitId
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public circuitDelete(circuitId: string): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "DELETE",
      url: "/api/v1/circuit/{circuit_id}/delete",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Circuit Proofs
   * Return list of ProofInfoResponse for proofs of circuit_id related to team.
   * @param circuitId
   * @param includeProofInput
   * @param includeProof
   * @param includePublic
   * @param includeVerificationKey
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public circuitProofs(
    circuitId: string,
    includeProofInput: boolean = false,
    includeProof: boolean = false,
    includePublic: boolean = false,
    includeVerificationKey: boolean = false,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/proofs",
      path: {
        circuit_id: circuitId,
      },
      query: {
        include_proof_input: includeProofInput,
        include_proof: includeProof,
        include_public: includePublic,
        include_verification_key: includeVerificationKey,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Create Proof for Circuit
   * Prove a circuit with specific inputs.
   * @param circuitId
   * @param formData
   * @returns ProofInfoResponse Created
   * @throws ApiError
   */
  public proofCreate(
    circuitId: string,
    formData: {
      /**
       * JSON-serialized string for the proof input.
       */
      proof_input: string;
      /**
       * Perform an internal verification on the resulting proof.
       */
      perform_verify?: boolean;
      /**
       * Internal prover implementation setting.
       */
      prover_implementation?: string;
    },
  ): CancelablePromise<ProofInfoResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/circuit/{circuit_id}/prove",
      path: {
        circuit_id: circuitId,
      },
      formData: formData,
      mediaType: "application/x-www-form-urlencoded",
      errors: {
        404: `Not Found`,
        412: `Precondition Failed`,
        501: `Not Implemented`,
      },
    });
  }
}
