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
  /**
   * The username of the user.
   */
  username: string;
  /**
   * The email address of the user.
   */
  email: string;
  /**
   * The date that the user joined Sindri.
   */
  date_joined: string;
  /**
   * The teams that the user is a member of.
   */
  teams: Array<TeamDetail>;
};
