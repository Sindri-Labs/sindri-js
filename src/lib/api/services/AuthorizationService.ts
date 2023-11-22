/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { APIKeyResponse } from "../models/APIKeyResponse";
import type { ObtainApikeyInput } from "../models/ObtainApikeyInput";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class AuthorizationService {
  /**
   * Generate API Key
   * Generates a long-term API Key from your account's username and password.
   * @param requestBody
   * @returns APIKeyResponse OK
   * @throws ApiError
   */
  public static apikeyGenerate(
    requestBody: ObtainApikeyInput,
  ): CancelablePromise<APIKeyResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/apikey/generate",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        401: `Unauthorized`,
      },
    });
  }

  /**
   * Generate long-term API Key (requires prior authentication)
   * Return a long-term API key for the user's team.
   * @param name
   * @returns APIKeyResponse Created
   * @throws ApiError
   */
  public static apikeyGenerateWithAuth(
    name: string = "",
  ): CancelablePromise<APIKeyResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/apikey/generate",
      query: {
        name: name,
      },
    });
  }

  /**
   * API Key List
   * Return a list of API Keys for the team.
   * @returns APIKeyResponse OK
   * @throws ApiError
   */
  public static apikeyList(): CancelablePromise<Array<APIKeyResponse>> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/apikey/list",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete API Key
   * Mark the specified API Key as deleted.
   * @param apikeyId
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public static apikeyDelete(
    apikeyId: string,
  ): CancelablePromise<ActionResponse> {
    return __request(OpenAPI, {
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
