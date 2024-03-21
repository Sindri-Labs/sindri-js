/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { SmartContractVerifierResponse } from "../models/SmartContractVerifierResponse";
import type { TeamMeResponse } from "../models/TeamMeResponse";
import type { UserMeResponse } from "../models/UserMeResponse";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

// DO NOT REMOVE
type BinaryResponseType = typeof globalThis extends { ReadableStream: unknown }
  ? Blob
  : NodeJS.ReadableStream;

export class InternalService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Circuit Download
   * Return the gzipped tarball for the specified circuit.
   * @param circuitId
   * @returns binary OK
   * @throws ApiError
   */
  public circuitDownload(
    circuitId: string,
    // DO NOT REMOVE
  ): CancelablePromise<BinaryResponseType> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/download",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
      responseType: process.env.BROWSER_BUILD ? "blob" : "stream", // DO NOT REMOVE
    });
  }

  /**
   * Circuit Smart Contract Verifier
   * Get smart contract verifier for existing circuit
   * @param circuitId
   * @returns SmartContractVerifierResponse OK
   * @throws ApiError
   */
  public circuitSmartContractVerifier(
    circuitId: string,
  ): CancelablePromise<SmartContractVerifierResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/smart_contract_verifier",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        412: `Precondition Failed`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Change user password (requires JWT authentication)
   * Change password for a user.
   *
   * This endpoint requires JWT authentication in order
   * to know which user is making the request. It expects to receive
   * an authenticated user in `request.auth`.
   *
   * We subsequently verify the old password and then update the user's password.
   * @param formData
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public passwordChangeWithJwtAuth(formData: {
    /**
     * Old password.
     */
    old_password: string;
    /**
     * New password.
     */
    new_password: string;
  }): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/password/change",
      formData: formData,
      mediaType: "application/x-www-form-urlencoded",
      errors: {
        422: `Unprocessable Entity`,
      },
    });
  }

  /**
   * Return the JSON schema for `sindri.json` manifest files
   * Return the JSON schema for `sindri.json` manifest files
   * @returns any OK
   * @throws ApiError
   */
  public sindriManifestSchema(): CancelablePromise<Record<string, any>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/sindri-manifest-schema.json",
    });
  }

  /**
   * Obtain team details for the currently authenticated team
   * Return details about the currently authenticated team.
   * @returns TeamMeResponse OK
   * @throws ApiError
   */
  public teamMe(): CancelablePromise<TeamMeResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/team/me",
    });
  }

  /**
   * Obtain user details (requires JWT authentication)
   * Return details about the user and their teams.
   *
   * This endpoint requires JWT authentication in order
   * to know which user is making the request. It expects to receive
   * an authenticated user in `request.auth`.
   * @returns UserMeResponse OK
   * @throws ApiError
   */
  public userMeWithJwtAuth(): CancelablePromise<UserMeResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/user/me",
    });
  }
}
