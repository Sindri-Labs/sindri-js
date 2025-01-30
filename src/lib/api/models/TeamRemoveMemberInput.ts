/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Client input to remove a user from a team.
 */
export type TeamRemoveMemberInput = {
  /**
   * The slug of the team to remove the user from.
   */
  team_slug: string;
  /**
   * The username of the user to remove.
   */
  username: string;
};
