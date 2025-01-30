/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Client input for filtering project list.
 */
export type ProjectListInput = {
  /**
   * Return projects owned by this team.
   * @deprecated
   */
  team_name?: string | null;
  /**
   * Return projects owned by this team.
   */
  team_slug?: string | null;
};
