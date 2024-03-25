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
   * Return the list of all circuit infos.
   * @returns CircuitInfoResponse OK
   * @throws ApiError
   */
  public circuitList(): CancelablePromise<Array<CircuitInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/list",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Circuit Detail
   * Get info for an existing circuit.
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @param includeVerificationKey Indicates whether to include the verification key in the response.
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
   * Mark the specified circuit and any of its related proofs as deleted.
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
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
   * Return a list of proof infos for the provided circuit_id.
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public circuitProofs(
    circuitId: string,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/proofs",
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
   * Create Proof for Circuit
   * Prove a circuit with specific inputs.
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @param formData
   * @returns ProofInfoResponse Created
   * @throws ApiError
   */
  public proofCreate(
    circuitId: string,
    formData: {
      /**
       * A string representing proof input which may be formatted as JSON for any framework. Noir circuits optionally accept TOML formatted proof input.
       */
      proof_input: string;
      /**
       * A boolean indicating whether to perform an internal verification check during the proof creation.
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
