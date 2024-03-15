/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { ProofInfoResponse } from "../models/ProofInfoResponse";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class ProofsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Proof List
   * Return list of ProofInfoResponse for proofs related to team.
   * @param includeProofInput
   * @param includeProof
   * @param includePublic
   * @param includeSmartContractCalldata
   * @param includeVerificationKey
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public proofList(
    includeProofInput: boolean = false,
    includeProof: boolean = false,
    includePublic: boolean = false,
    includeSmartContractCalldata: boolean = false,
    includeVerificationKey: boolean = false,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/proof/list",
      query: {
        include_proof_input: includeProofInput,
        include_proof: includeProof,
        include_public: includePublic,
        include_smart_contract_calldata: includeSmartContractCalldata,
        include_verification_key: includeVerificationKey,
      },
      errors: {
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Proof Detail
   * Get info for existing proof
   * @param proofId
   * @param includeProofInput
   * @param includeProof
   * @param includePublic
   * @param includeSmartContractCalldata
   * @param includeVerificationKey
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public proofDetail(
    proofId: string,
    includeProofInput: boolean = true,
    includeProof: boolean = true,
    includePublic: boolean = true,
    includeSmartContractCalldata: boolean = false,
    includeVerificationKey: boolean = true,
  ): CancelablePromise<ProofInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/proof/{proof_id}/detail",
      path: {
        proof_id: proofId,
      },
      query: {
        include_proof_input: includeProofInput,
        include_proof: includeProof,
        include_public: includePublic,
        include_smart_contract_calldata: includeSmartContractCalldata,
        include_verification_key: includeVerificationKey,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Delete Proof
   * Mark the specified proof as deleted.
   * @param proofId
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public proofDelete(proofId: string): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "DELETE",
      url: "/api/v1/proof/{proof_id}/delete",
      path: {
        proof_id: proofId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
}
