/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to create a team with team_slug.
 * Error: A team with this slug already exists.
 */
export type TeamAlreadyExistsResponse = {
  error: string;
  exception_id?: string;
  message: string;
  team_slug: string;
};
