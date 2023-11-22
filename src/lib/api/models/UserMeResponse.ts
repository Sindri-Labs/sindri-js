/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TeamDetail } from "./TeamDetail";

/**
 * Details about the currently authenticated user.
 */
export type UserMeResponse = {
  first_name: string;
  last_name: string;
  username: string;
  teams: Array<TeamDetail>;
};
