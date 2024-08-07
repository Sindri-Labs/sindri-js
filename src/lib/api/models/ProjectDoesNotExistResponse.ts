/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Action: Attempt to fetch a project with project_id.
 * Error: A project matching project_id does not exist for the team.
 */
export type ProjectDoesNotExistResponse = {
  error: string;
  project_id: string;
  message: string;
};
