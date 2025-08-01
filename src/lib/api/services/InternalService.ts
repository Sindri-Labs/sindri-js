/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionResponse } from "../models/ActionResponse";
import type { CircuitInfoResponse } from "../models/CircuitInfoResponse";
import type { CircuitStatusResponse } from "../models/CircuitStatusResponse";
import type { PagedCircuitInfoResponse } from "../models/PagedCircuitInfoResponse";
import type { PagedProjectInfoResponse } from "../models/PagedProjectInfoResponse";
import type { PagedProofInfoResponse } from "../models/PagedProofInfoResponse";
import type { PasswordChangeInput } from "../models/PasswordChangeInput";
import type { ProjectInfoResponse } from "../models/ProjectInfoResponse";
import type { ProjectListInput } from "../models/ProjectListInput";
import type { ProjectSettingsInput } from "../models/ProjectSettingsInput";
import type { ProofHistogramInput } from "../models/ProofHistogramInput";
import type { ProofHistogramResponse } from "../models/ProofHistogramResponse";
import type { ProofInfoResponse } from "../models/ProofInfoResponse";
import type { ProofListInput } from "../models/ProofListInput";
import type { ProofStatusResponse } from "../models/ProofStatusResponse";
import type { SmartContractVerifierResponse } from "../models/SmartContractVerifierResponse";
import type { TeamCreateInput } from "../models/TeamCreateInput";
import type { TeamDetail } from "../models/TeamDetail";
import type { TeamInviteInput } from "../models/TeamInviteInput";
import type { TeamMembersResponse } from "../models/TeamMembersResponse";
import type { TeamMeResponse } from "../models/TeamMeResponse";
import type { TeamRemoveMemberInput } from "../models/TeamRemoveMemberInput";
import type { TeamSettingsInput } from "../models/TeamSettingsInput";
import type { UserLoginInput } from "../models/UserLoginInput";
import type { UserMeResponse } from "../models/UserMeResponse";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

// DO NOT REMOVE
type BinaryResponseType = typeof globalThis extends { ReadableStream: unknown }
  ? Blob
  : NodeJS.ReadableStream;

export class InternalService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * Change Password
   * Change user password. Requires user authentication.
   * @param requestBody
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public passwordChangeWithJwtAuth(
    requestBody: PasswordChangeInput,
  ): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/password/change",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Unprocessable Entity`,
      },
    });
  }

  /**
   * Sindri Manifest Schema
   * Return Sindri manifest schema as JSON.
   * @returns any OK
   * @throws ApiError
   */
  public sindriManifestSchema(): CancelablePromise<Record<string, any>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/sindri-manifest-schema.json",
    });
  }

  /**
   * Circuit File Download
   * Obtain circuit file(s).
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @param path The optional file path within the circuit package to download.
   * @returns any OK
   * @throws ApiError
   */
  public circuitDownload(
    circuitId: string,
    path?: string,
    // DO NOT REMOVE
  ): CancelablePromise<BinaryResponseType> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/download",
      path: {
        circuit_id: circuitId,
      },
      query: {
        path: path,
      },
      errors: {
        404: `Not Found`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Circuit Proofs
   * List all proofs for a circuit.
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @param limit The number of proofs to return.
   * @param offset The number of proofs to skip.
   * @returns PagedProofInfoResponse OK
   * @throws ApiError
   */
  public circuitProofsPaginated(
    circuitId: string,
    limit: number = 100,
    offset?: number,
  ): CancelablePromise<PagedProofInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/proofs/paginated",
      path: {
        circuit_id: circuitId,
      },
      query: {
        limit: limit,
        offset: offset,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },

      responseType: process.env.BROWSER_BUILD ? "blob" : "stream", // DO NOT REMOVE
    });
  }

  /**
   * Circuit Smart Contract Verifier
   * Get smart contract verifier for existing circuit
   * @param circuitId The circuit identifer of the circuit.
   * This can take one of the following forms:
   *
   * 1. `<CIRCUIT_ID>` - The unique UUID4 ID for an exact version of a compiled circuit.
   * 2. `<CIRCUIT_NAME>` - The name of a circuit owned by the authenticated team. This will default to
   * the most recent version of the circuit tagged as `latest`.
   * 3. `<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by the authenticated team and an explicit
   * tag. This corresponds to the most recent compilation of the circuit with the specified tag.
   * 4. `<TEAM_NAME>/<CIRCUIT_NAME>` - The name of a circuit owned by the specified team.  This will
   * default to the most recent version of the circuit tagged as `latest`.
   * 5. `<TEAM_NAME>/<CIRCUIT_NAME>:<TAG>` - The name of a circuit owned by a specified team and an
   * explicit tag. This corresponds to the most recent compilation of the team's circuit with the
   * specified tag.
   * @returns SmartContractVerifierResponse OK
   * @throws ApiError
   */
  public circuitSmartContractVerifier(
    circuitId: string,
  ): CancelablePromise<SmartContractVerifierResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/smart_contract_verifier",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

  /**
   * Circuit Status
   * Get status for a specific circuit.
   * @param circuitId The UUID4 identifier associated with this circuit.
   * @returns CircuitStatusResponse OK
   * @throws ApiError
   */
  public circuitStatus(
    circuitId: string,
  ): CancelablePromise<CircuitStatusResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/circuit/{circuit_id}/status",
      path: {
        circuit_id: circuitId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project List
   * List all projects meeting filter criteria.
   * @param requestBody
   * @returns ProjectInfoResponse OK
   * @throws ApiError
   */
  public projectList(
    requestBody: ProjectListInput,
  ): CancelablePromise<Array<ProjectInfoResponse>> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/project/list",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project List
   * List all projects meeting filter criteria.
   * @param requestBody
   * @param limit The number of projects to return.
   * @param offset The number of projects to skip.
   * @returns PagedProjectInfoResponse OK
   * @throws ApiError
   */
  public projectListPaginated(
    requestBody: ProjectListInput,
    limit: number = 100,
    offset?: number,
  ): CancelablePromise<PagedProjectInfoResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/project/list/paginated",
      query: {
        limit: limit,
        offset: offset,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project Proofs
   * Get all proofs for a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public projectProofs(
    projectId: string,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/project/{project_id}/proofs",
      path: {
        project_id: projectId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project Circuits
   * List all circuits for a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @returns CircuitInfoResponse OK
   * @throws ApiError
   */
  public projectCircuits(
    projectId: string,
  ): CancelablePromise<Array<CircuitInfoResponse>> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/project/{project_id}/circuits",
      path: {
        project_id: projectId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project Circuits
   * List all circuits for a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @param limit The number of circuits to return.
   * @param offset The number of circuits to skip.
   * @returns PagedCircuitInfoResponse OK
   * @throws ApiError
   */
  public projectCircuitsPaginated(
    projectId: string,
    limit: number = 100,
    offset?: number,
  ): CancelablePromise<PagedCircuitInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/project/{project_id}/circuits/paginated",
      path: {
        project_id: projectId,
      },
      query: {
        limit: limit,
        offset: offset,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete Project
   * Delete a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public projectDelete(projectId: string): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "DELETE",
      url: "/api/v1/project/{project_id}/delete",
      path: {
        project_id: projectId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project Detail
   * Get info for a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @returns ProjectInfoResponse OK
   * @throws ApiError
   */
  public projectDetail(
    projectId: string,
  ): CancelablePromise<ProjectInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/project/{project_id}/detail",
      path: {
        project_id: projectId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Project Proofs
   * Get all proofs for a project.
   * @param projectId The project identifer of the project.
   * This can take one of the following forms:
   *
   * 1. `<PROJECT_ID>` - The unique UUID4 ID for a project.
   * 2. `<TEAM_NAME>/<PROJECT_NAME>` - The name of a project owned by the specified team.
   * @param limit The number of proofs to return.
   * @param offset The number of proofs to skip.
   * @returns PagedProofInfoResponse OK
   * @throws ApiError
   */
  public projectProofsPaginated(
    projectId: string,
    limit: number = 100,
    offset?: number,
  ): CancelablePromise<PagedProofInfoResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/project/{project_id}/proofs/paginated",
      path: {
        project_id: projectId,
      },
      query: {
        limit: limit,
        offset: offset,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update Project Settings
   * Update project settings.
   * @param projectName The name of a project associated with the team.
   * @param requestBody
   * @returns ProjectInfoResponse OK
   * @throws ApiError
   */
  public projectSettings(
    projectName: string,
    requestBody: ProjectSettingsInput,
  ): CancelablePromise<ProjectInfoResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/project/{project_name}/settings",
      path: {
        project_name: projectName,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        404: `Not Found`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Proof Histogram
   * Get histogram data for a team's proofs.
   * @param requestBody
   * @returns ProofHistogramResponse OK
   * @throws ApiError
   */
  public proofHistogram(
    requestBody: ProofHistogramInput,
  ): CancelablePromise<ProofHistogramResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/proof/histogram",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Proof List
   * List proofs for the requesting team.
   * @param requestBody
   * @returns ProofInfoResponse OK
   * @throws ApiError
   */
  public proofList(
    requestBody: ProofListInput,
  ): CancelablePromise<Array<ProofInfoResponse>> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/proof/list",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Proof List
   * List proofs for the requesting team.
   * @param requestBody
   * @param limit The number of proofs to return.
   * @param offset The number of proofs to skip.
   * @returns PagedProofInfoResponse OK
   * @throws ApiError
   */
  public proofListPaginated(
    requestBody: ProofListInput,
    limit: number = 100,
    offset?: number,
  ): CancelablePromise<PagedProofInfoResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/proof/list/paginated",
      query: {
        limit: limit,
        offset: offset,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Proof Status
   * Get status for a specific proof.
   * @param proofId The UUID4 identifier associated with this proof.
   * @returns ProofStatusResponse OK
   * @throws ApiError
   */
  public proofStatus(proofId: string): CancelablePromise<ProofStatusResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/proof/{proof_id}/status",
      path: {
        proof_id: proofId,
      },
      errors: {
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Avatar Upload
   * Upload avatar for the team
   * @param formData
   * @returns TeamMeResponse Created
   * @throws ApiError
   */
  public teamAvatarUpload(formData: {
    files: Array<Blob>;
  }): CancelablePromise<TeamMeResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/team/avatar/upload",
      formData: formData,
      mediaType: "multipart/form-data",
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Create Team
   * Create a new team
   * @param requestBody
   * @param sindriTeamId Required for Sindri JWT authentication.
   * @returns TeamDetail Created
   * @throws ApiError
   */
  public teamCreate(
    requestBody: TeamCreateInput,
    sindriTeamId?: string | null,
  ): CancelablePromise<TeamDetail> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/team/create",
      headers: {
        "Sindri-Team-Id": sindriTeamId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        400: `Bad Request`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Team Detail
   * Return details for the specified team
   * @param teamSlug
   * @returns TeamDetail OK
   * @throws ApiError
   */
  public teamDetail(teamSlug: string): CancelablePromise<TeamDetail> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/team/{team_slug}/detail",
      path: {
        team_slug: teamSlug,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }

  /**
   * Team Invite
   * Invite an email address to join the specified team
   * @param requestBody
   * @param sindriTeamId Required for Sindri JWT authentication.
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public teamInvite(
    requestBody: TeamInviteInput,
    sindriTeamId?: string | null,
  ): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/team/invite",
      headers: {
        "Sindri-Team-Id": sindriTeamId,
      },
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * Team Me
   * Obtain team details for the currently authenticated team
   * @returns TeamMeResponse OK
   * @throws ApiError
   */
  public teamMe(): CancelablePromise<TeamMeResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/team/me",
    });
  }

  /**
   * Team Members
   * Return member list for the specified team
   * @param teamSlug
   * @param sindriTeamId Required for Sindri JWT authentication.
   * @returns TeamMembersResponse OK
   * @throws ApiError
   */
  public teamMembers(
    teamSlug: string,
    sindriTeamId?: string | null,
  ): CancelablePromise<TeamMembersResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/team/{team_slug}/members",
      path: {
        team_slug: teamSlug,
      },
      headers: {
        "Sindri-Team-Id": sindriTeamId,
      },
      errors: {
        404: `Not Found`,
      },
    });
  }

  /**
   * Team Remove Member
   * Remove a user from the specified team. Revokes all team API keys if the removed user was the last team member.
   * @param requestBody
   * @param sindriTeamId Required for Sindri JWT authentication.
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public teamRemoveMember(
    requestBody: TeamRemoveMemberInput,
    sindriTeamId?: string | null,
  ): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/team/remove-member",
      headers: {
        "Sindri-Team-Id": sindriTeamId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }

  /**
   * Update Team Settings
   * Update team settings.
   * @param requestBody
   * @returns TeamDetail OK
   * @throws ApiError
   */
  public teamSettings(
    requestBody: TeamSettingsInput,
  ): CancelablePromise<TeamDetail> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/team/settings",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        404: `Not Found`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Login User
   * Login a user.
   * @param requestBody
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public userLogin(
    requestBody: UserLoginInput,
  ): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/user/login",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
      },
    });
  }

  /**
   * Logout User
   * Logout a user.
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public userLogout(): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/user/logout",
    });
  }

  /**
   * User Me
   * Obtain user details. Requires user authentication.
   * @returns UserMeResponse OK
   * @throws ApiError
   */
  public userMe(): CancelablePromise<UserMeResponse> {
    return this.httpRequest.request({
      method: "GET",
      url: "/api/v1/user/me",
    });
  }

  /**
   * Change Password
   * Change user password. Requires user authentication.
   * @param requestBody
   * @returns ActionResponse OK
   * @throws ApiError
   */
  public userPassword(
    requestBody: PasswordChangeInput,
  ): CancelablePromise<ActionResponse> {
    return this.httpRequest.request({
      method: "POST",
      url: "/api/v1/user/password",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        422: `Unprocessable Entity`,
      },
    });
  }
}
