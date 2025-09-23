/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Request body for updating an API key's expiration date.
 */
export type APIKeyUpdateRequest = {
  /**
   * The new expiration date for the API key. Set to null to remove expiration. The date should be in ISO8601 format.
   */
  date_expires: string | null;
};
