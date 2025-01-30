/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to reference a team with team_slug.
 * Error: A team with team_slug does not exist.
 */
export type TeamDoesNotExistResponse = {
  error: string;
  exception_id?: string;
  message: string;
  /**
   * @deprecated
   */
  team_name: string;
  team_slug: string;
};
