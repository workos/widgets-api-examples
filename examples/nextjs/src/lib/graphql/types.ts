/**
 * Hand-written types for the Client API documents in `operations.ts`.
 *
 * A production app would generate these from the schema with GraphQL Code Generator;
 * they are written out here so the example stays dependency-light and readable.
 */

export type PaginationOrder = "Asc" | "Desc" | "Normal";

export type ListMetadata = {
	after: string | null;
	before: string | null;
};

export type OAuthProvider =
	| "AppleOAuth"
	| "BitbucketOAuth"
	| "DiscordOAuth"
	| "GitLabOAuth"
	| "GithubOAuth"
	| "GoogleOAuth"
	| "IntuitOAuth"
	| "LinkedInOAuth"
	| "MicrosoftOAuth"
	| "SalesforceOAuth"
	| "SlackOAuth"
	| "VercelMarketplaceOAuth"
	| "VercelOAuth"
	| "XeroOAuth";

export type ConnectedAccount = {
	id: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	provider: OAuthProvider;
	profilePictureUrl: string | null;
	lastLoginAt: string | null;
};

export type User = {
	id: string;
	email: string;
	emailVerified: boolean;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
	mfaEnabled: boolean | null;
	mfaLastUsedAt: string | null;
	connectedAccounts: ConnectedAccount[];
	createdAt: string;
	updatedAt: string;
};

export type Organization = {
	id: string;
	name: string;
	allowProfilesOutsideOrganization: boolean;
	createdAt: string;
	updatedAt: string;
};

export type UserOrganization = {
	id: string;
	name: string;
	isCurrent: boolean;
};

export type OrganizationMemberStatus =
	| "Active"
	| "Invited"
	| "InviteExpired"
	| "InviteRevoked"
	| "NoInvite";

export type OrganizationMemberRole = {
	slug: string;
	name: string;
};

export type OrganizationMember = {
	id: string;
	email: string;
	emailVerified: boolean;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
	status: OrganizationMemberStatus;
	lastActivityAt: string | null;
	roles: OrganizationMemberRole[];
	createdAt: string;
};

export type Role = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
};

export type Permission = {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	system: boolean;
	createdAt?: string;
	updatedAt?: string;
};

export type Session = {
	id: string;
	isCurrent: boolean;
	state: { tag: string; expiresAt: string | null };
	ipAddress: string | null;
	userAgent: string | null;
	organizationId: string | null;
	lastActivityAt: string | null;
	currentLocation: { cityName: string; countryISOCode: string } | null;
	createdAt: string;
	updatedAt: string;
};

export type Passkey = {
	id: string;
	lastVerifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

export type ConnectionState = "Active" | "Inactive" | "Validating" | "Deleting";

export type ConnectionType =
	| "OktaSAML"
	| "AzureSAML"
	| "GenericSAML"
	| "GoogleSAML"
	| "JumpCloudSAML"
	| "PingOneSAML"
	| "EntraIdOIDC"
	| "GenericOIDC"
	| "OktaOIDC";

export type Connection = {
	id: string;
	name: string;
	type: ConnectionType;
	state: ConnectionState;
	setupComplete: boolean;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
};

export type Directory = {
	id: string;
	name: string;
	type: string;
	state: string;
	externalKey: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
};

export type DirectoryUser = {
	id: string;
	idpId: string;
	email: string | null;
	username: string | null;
	firstName: string | null;
	lastName: string | null;
	state: string;
	directoryId: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
};

export type DirectoryGroup = {
	id: string;
	idpId: string;
	name: string;
	directoryId: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
};

export type AuditEvent = {
	id: string;
	action: string;
	occurredAt: string;
	actor: { id: string; type: string; name: string | null };
	targets: string[];
	data: Record<string, unknown> | null;
	createdAt: string;
	updatedAt: string;
};

export type AuditLogExport = {
	id: string;
	state: "Pending" | "Ready" | "Error" | "Expired";
	/** Signed CSV URL, only set once the export is `Ready`. */
	url: string | null;
	createdAt: string;
	updatedAt: string;
};

export type OrganizationInvitation = {
	id: string;
	email: string;
	roleSlug: string | null;
	status: "Pending" | "Accepted" | "Expired" | "Revoked";
	expiresAt: string;
	createdAt: string;
};

/**
 * Every mutation result union member carries `__typename`, which drives the UI.
 * Extra fields are typed loosely because each member has a different shape.
 */
export type UnionResult<T extends string = string> = {
	__typename: T;
	[key: string]: unknown;
};

// --- Query results ---------------------------------------------------------

export type MeQueryResult = { me: User };
export type OrganizationsQueryResult = { organizations: UserOrganization[] };
export type OrganizationQueryResult = { organization: Organization | null };
export type OrganizationMembershipsQueryResult = {
	organizationMemberships: { data: OrganizationMember[]; listMetadata: ListMetadata };
};
export type RolesQueryResult = {
	roles: { multipleRolesEnabled: boolean; roles: Role[] };
};
export type PermissionsQueryResult = {
	permissions: { data: Permission[]; listMetadata: ListMetadata };
};
export type EffectivePermissionsQueryResult = { effectivePermissions: Permission[] };
export type SessionsQueryResult = { sessions: Session[] };
export type PasskeysQueryResult = { passkeys: Passkey[] };
export type SsoConnectionsQueryResult = { ssoConnections: Connection[] };
export type SsoConnectionQueryResult = { ssoConnection: Connection | null };
export type DirectoryConnectionQueryResult = { directoryConnection: Directory | null };
export type DirectoryConnectionsQueryResult = {
	directoryConnections: { data: Directory[]; listMetadata: ListMetadata };
};
export type DirectoryUsersQueryResult = {
	directoryUsers: { data: DirectoryUser[]; listMetadata: ListMetadata };
};
export type DirectoryGroupsQueryResult = {
	directoryGroups: { data: DirectoryGroup[]; listMetadata: ListMetadata };
};
export type AuditEventsQueryResult = {
	auditEvents: { data: AuditEvent[]; listMetadata: ListMetadata };
};
export type AuditEventQueryResult = { auditEvent: AuditEvent | null };
export type AuditLogExportQueryResult = { auditLogExport: AuditLogExport };

// --- Mutation results ------------------------------------------------------

export type UpdateProfileMutationResult = { updateProfile: UnionResult };
export type InviteUserMutationResult = { inviteUser: UnionResult };
export type UpdateMemberRoleMutationResult = { updateMemberRole: UnionResult };
export type RemoveMemberMutationResult = { removeMember: UnionResult };
export type RevokeInvitationMutationResult = { revokeInvitation: UnionResult };
export type ResendInvitationMutationResult = { resendInvitation: UnionResult };
export type CreatePasswordMutationResult = { createPassword: UnionResult };
export type UpdatePasswordMutationResult = { updatePassword: UnionResult };
export type EnrollTotpMutationResult = { enrollTotp: UnionResult };
export type VerifyTotpMutationResult = { verifyTotp: UnionResult };
export type RemoveMfaFactorMutationResult = { removeMfaFactor: UnionResult };
export type SendVerificationCodeMutationResult = {
	sendVerificationCode: UnionResult;
};
export type VerifyCurrentEmailMutationResult = { verifyCurrentEmail: UnionResult };
export type SendEmailChangeMutationResult = { sendEmailChange: UnionResult };
export type ConfirmEmailChangeMutationResult = { confirmEmailChange: UnionResult };
export type RevokeSessionMutationResult = { revokeSession: UnionResult };
export type RevokeAllSessionsMutationResult = { revokeAllSessions: UnionResult };
export type CreateRoleMutationResult = { createRole: Role };
export type UpdateRoleMutationResult = { updateRole: Role };
export type DeleteRoleMutationResult = { deleteRole: { id: string } };
export type AssignPermissionToRoleMutationResult = { assignPermissionToRole: Role };
export type CreateSsoConnectionMutationResult = { createSsoConnection: Connection };
export type UpdateSsoConnectionMutationResult = { updateSsoConnection: Connection };
export type DeleteSsoConnectionMutationResult = { deleteSsoConnection: string };
export type CreateAuditLogExportMutationResult = {
	createAuditLogExport: UnionResult;
};
