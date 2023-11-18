/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIKeyResponse } from "../models/APIKeyResponse";
import type { ForgeObtainApikeyInput } from "../models/ForgeObtainApikeyInput";

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
    requestBody: ForgeObtainApikeyInput,
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
   * Return a long-term API key for the user. This will replace the user's existing API key!
   * @returns APIKeyResponse OK
   * @throws ApiError
   */
  public static apikeyGenerateWithAuth(): CancelablePromise<APIKeyResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/apikey/generate",
    });
  }
}
