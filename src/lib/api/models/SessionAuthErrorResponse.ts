/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to login with username and password.
 * Error: User does not exist or password is incorrect.
 */
export type SessionAuthErrorResponse = {
  exception_id?: string;
  message?: string;
  username: string;
};
