/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { APIKeyResponse } from "../models/APIKeyResponse";
import type { ObtainApikeyInput } from "../models/ObtainApikeyInput";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class AuthorizationService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Generate API Key
   * Generates a long-term API Key from your account's username and password.
   * @param requestBody
   * @returns APIKeyResponse OK
   * @throws ApiError
   */
  public apikeyGenerate(
    requestBody: ObtainApikeyInput,
  ): CancelablePromise<APIKeyResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/apikey/generate",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
      },
    });
  }

  /**
   * API Key Generate
   * Generate an API key for the requesting team.
   * @param name An optional name or tag to assign to the generated API Key.
   * @returns APIKeyResponse Created
   * @throws ApiError
   */
  public apikeyGenerateWithAuth(
    name?: string,
  ): CancelablePromise<APIKeyResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/apikey/generate",
      query: {
        name: name,
      },
      errors: {
        400: `Bad Request`,
      },
    });
  }

  /**
   * API Key List
   * List API keys for the requesting team.
   * @returns APIKeyResponse OK
   * @throws ApiError
   */
  public apikeyList(): CancelablePromise<Array<APIKeyResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/apikey/list",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * API Key Delete
   * Delete a specific API key.
   * @param apikeyId The UUID4 identifier associated with this API Key.
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public apikeyDelete(apikeyId: string): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "DELETE",
      url: "/api/v1/apikey/{apikey_id}/delete",
      path: {
        apikey_id: apikeyId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }
}
