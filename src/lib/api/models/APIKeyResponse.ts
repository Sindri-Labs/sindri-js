/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Response containing an API key.
 *
 * This key is used in conjunction with the APIKey model
 * to authenticate users in the API.
 */
export type APIKeyResponse = {
  /**
   * The API key. Will be `null` unless the key was created during the request. Keys are not stored in plaintext and can not be recovered after creation time.
   */
  api_key?: string;
  /**
   * The date that the API key was created.
   */
  date_created: string;
  /**
   * The date that the API key will automatically expire.
   */
  date_expires?: string;
  /**
   * The last time that the API key was used to authenticate with the API.
   */
  date_last_used?: string;
  /**
   * The database ID for the API key. Used when deleting keys.
   */
  id: string;
  /**
   * The human-readable name for the API key used for managing keys.
   */
  name: string;
  /**
   * The non-secret key prefix.
   */
  prefix: string;
  /**
   * The non-secret key suffix. Helpful for identifying keys if a name wasn't specified at creation time.
   */
  suffix: string;
};
