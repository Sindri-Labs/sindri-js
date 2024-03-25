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
   * Proof Detail
   * Get info for an existing proof.
   * @param proofId The UUID4 identifier associated with this proof.
   * @param includeProof Indicates whether to include the proof in the response.
   * @param includePublic Indicates whether to include public inputs in the response.
   * @param includeSmartContractCalldata Indicates whether to include the proof and public formatted as smart contract calldata in the response.
   * @param includeVerificationKey Indicates whether to include the circuit's verification key in the response.
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public proofDetail(
    proofId: string,
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
   * @param proofId The UUID4 identifier associated with this proof.
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
