/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Schema } from "../models/Schema";
import type { TokenObtainPairInputSchema } from "../models/TokenObtainPairInputSchema";
import type { TokenObtainPairOutputSchema } from "../models/TokenObtainPairOutputSchema";
import type { TokenRefreshInputSchema } from "../models/TokenRefreshInputSchema";
import type { TokenRefreshOutputSchema } from "../models/TokenRefreshOutputSchema";
import type { TokenVerifyInputSchema } from "../models/TokenVerifyInputSchema";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class TokenService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Verify Token
   * @param requestBody
   * @returns Schema OK
   * @throws ApiError
   */
  public jwtTokenVerify(
    requestBody: TokenVerifyInputSchema,
  ): CancelablePromise<Schema> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/token/verify",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * Generate JWT Token Pair
   * Override the ninja_jwt default `obtain_token` method in order to
   * add email verification check before generating a token.
   * @param requestBody
   * @returns TokenObtainPairOutputSchema OK
   * @throws ApiError
   */
  public jwtTokenGenerate(
    requestBody: TokenObtainPairInputSchema,
  ): CancelablePromise<TokenObtainPairOutputSchema> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/token/pair",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        403: `Forbidden`,
      },
    });
  }

  /**
   * Refresh Token
   * @param requestBody
   * @returns TokenRefreshOutputSchema OK
   * @throws ApiError
   */
  public jwtTokenRefresh(
    requestBody: TokenRefreshInputSchema,
  ): CancelablePromise<TokenRefreshOutputSchema> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/token/refresh",
      body: requestBody,
      mediaType: "application/json",
    });
  }
}
