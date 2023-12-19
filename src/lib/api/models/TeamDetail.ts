/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Details about a team.
 */
export type TeamDetail = {
  description: string;
  id: number;
  /**
   * Whether the team is a personal team.
   */
  is_personal: boolean;
  /**
   * The name of the team.
   */
  name: string;
  /**
   * Whether the team is a Sindri corporate team.
   */
  sindri_corporate: boolean;
  /**
   * The slug for the team (used for routing).
   */
  slug: string;
  /**
   * The URL for the team's website.
   */
  url: string;
};
