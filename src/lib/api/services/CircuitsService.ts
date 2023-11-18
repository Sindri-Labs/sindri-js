/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { CircomCircuitInfoResponse } from "../models/CircomCircuitInfoResponse";
import type { GnarkCircuitInfoResponse } from "../models/GnarkCircuitInfoResponse";
import type { Halo2CircuitInfoResponse } from "../models/Halo2CircuitInfoResponse";
import type { ProofIdResponse } from "../models/ProofIdResponse";
import type { ProofInfoResponse } from "../models/ProofInfoResponse";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class CircuitsService {
  /**
   * Circuit List
   * Return a list of CircuitInfoResponse for circuits related to user.
   * @param includeVerificationKey
   * @returns any OK
   * @throws ApiError
   */
  public static circuitList(
    includeVerificationKey: boolean = false,
  ): CancelablePromise<
    Array<
      | CircomCircuitInfoResponse
      | Halo2CircuitInfoResponse
      | GnarkCircuitInfoResponse
    >
  > {
    return __request(OpenAPI, {
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
   * Create Circuit
   * Create a circuit.
   * @param formData
   * @returns any Created
   * @throws ApiError
   */
  public static circuitCreate(formData: {
    circuit_name: string;
    /**
     * CircuitType choices
     */
    circuit_type: "Circom" | "Halo2" | "Gnark";
  }): CancelablePromise<
    | CircomCircuitInfoResponse
    | Halo2CircuitInfoResponse
    | GnarkCircuitInfoResponse
  > {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/circuit/create",
      formData: formData,
      mediaType: "application/x-www-form-urlencoded",
      errors: {
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Circuit Detail
   * Get info for existing circuit
   * @param circuitId
   * @param includeVerificationKey
   * @returns any OK
   * @throws ApiError
   */
  public static circuitDetail(
    circuitId: string,
    includeVerificationKey: boolean = true,
  ): CancelablePromise<
    | CircomCircuitInfoResponse
    | Halo2CircuitInfoResponse
    | GnarkCircuitInfoResponse
  > {
    return __request(OpenAPI, {
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
   * Compile Circuit
   * Compile a circuit.
   * @param circuitId
   * @returns ActionResponse Created
   * @throws ApiError
   */
  public static circuitCompile(
    circuitId: string,
  ): CancelablePromise<ActionResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/circuit/{circuit_id}/compile",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Circuit Proofs
   * Return list of ProofInfoResponse for proofs of circuit_id related to user.
   * @param circuitId
   * @param includeProofInput
   * @param includeProof
   * @param includePublic
   * @param includeVerificationKey
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public static circuitProofs(
    circuitId: string,
    includeProofInput: boolean = false,
    includeProof: boolean = false,
    includePublic: boolean = false,
    includeVerificationKey: boolean = false,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return __request(OpenAPI, {
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
   * @returns ProofIdResponse Created
   * @throws ApiError
   */
  public static proofCreate(
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
  ): CancelablePromise<ProofIdResponse> {
    return __request(OpenAPI, {
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

  /**
   * Upload Files for Circuit
   * Upload files for a circuit. We only allow 1 file for now, and it must be a Tarfile.
   * @param circuitId
   * @param formData
   * @returns ActionResponse Created
   * @throws ApiError
   */
  public static circuitUploadfiles(
    circuitId: string,
    formData: {
      files: Array<Blob>;
    },
  ): CancelablePromise<ActionResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/circuit/{circuit_id}/uploadfiles",
      path: {
        circuit_id: circuitId,
      },
      formData: formData,
      mediaType: "multipart/form-data",
      errors: {
        404: `Not Found`,
        412: `Precondition Failed`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }
}
