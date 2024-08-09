/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to reference a team with team_name.
 * Error: A team with team_name does not exist.
 */
export type TeamDoesNotExistResponse = {
  error: string;
  team_name: string;
  message: string;
};
