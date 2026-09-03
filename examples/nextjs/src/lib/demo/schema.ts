/**
 * SDL for the subset of the WorkOS Client API that this example exercises.
 *
 * WorkOS serves the real schema at https://api.workos.com/client/graphql. This copy
 * exists so demo mode can execute the exact same documents locally, which keeps the
 * widgets honest: if an operation would not type-check against the real API, it will
 * not execute here either.
 */
export const clientApiSchema = /* GraphQL */ `
	scalar DateTime
	scalar JSON

	enum PaginationOrder {
		Asc
		Desc
		Normal
	}

	enum OrganizationMemberStatus {
		Active
		Invited
		InviteExpired
		InviteRevoked
		NoInvite
	}

	enum OrganizationInvitationStatus {
		Pending
		Accepted
		Expired
		Revoked
	}

	enum OAuthProvider {
		AppleOAuth
		BitbucketOAuth
		DiscordOAuth
		GitLabOAuth
		GithubOAuth
		GoogleOAuth
		IntuitOAuth
		LinkedInOAuth
		MicrosoftOAuth
		SalesforceOAuth
		SlackOAuth
		VercelMarketplaceOAuth
		VercelOAuth
		XeroOAuth
	}

	enum ConnectionState {
		Active
		Inactive
		Validating
		Deleting
	}

	enum ConnectionType {
		OktaSAML
		AzureSAML
		GenericSAML
		GoogleSAML
		JumpCloudSAML
		PingOneSAML
		EntraIdOIDC
		GenericOIDC
		OktaOIDC
	}

	enum AuditLogExportState {
		Pending
		Ready
		Error
		Expired
	}

	type ConnectedAccount {
		id: ID!
		email: String
		firstName: String
		lastName: String
		provider: OAuthProvider!
		profilePictureUrl: String
		lastLoginAt: DateTime
	}

	type User {
		id: ID!
		email: String!
		emailVerified: Boolean!
		firstName: String
		lastName: String
		profilePictureUrl: String
		mfaEnabled: Boolean!
		mfaLastUsedAt: DateTime
		connectedAccounts: [ConnectedAccount!]!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type Organization {
		id: ID!
		name: String!
		allowProfilesOutsideOrganization: Boolean!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type UserOrganization {
		id: ID!
		name: String!
		isCurrent: Boolean!
	}

	type OrganizationMemberRole {
		slug: String!
		name: String!
	}

	type OrganizationMember {
		id: ID!
		email: String!
		emailVerified: Boolean!
		firstName: String
		lastName: String
		profilePictureUrl: String
		status: OrganizationMemberStatus!
		lastActivityAt: DateTime
		roles: [OrganizationMemberRole!]!
		createdAt: DateTime!
	}

	type ListMetadata {
		after: String
		before: String
	}

	type OrganizationMemberList {
		data: [OrganizationMember!]!
		listMetadata: ListMetadata!
	}

	type Role {
		id: ID!
		slug: String!
		name: String!
		description: String
		isDefault: Boolean!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type RolesResult {
		roles: [Role!]!
		multipleRolesEnabled: Boolean!
	}

	type Permission {
		id: ID!
		slug: String!
		name: String!
		description: String
		system: Boolean!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type PermissionList {
		data: [Permission!]!
		listMetadata: ListMetadata!
	}

	type SessionState {
		tag: String!
		expiresAt: DateTime
	}

	type SessionLocation {
		cityName: String!
		countryISOCode: String!
	}

	type Session {
		id: ID!
		isCurrent: Boolean!
		state: SessionState!
		ipAddress: String
		userAgent: String
		organizationId: String
		lastActivityAt: DateTime
		currentLocation: SessionLocation
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type Passkey {
		id: ID!
		lastVerifiedAt: DateTime
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type Connection {
		id: ID!
		name: String!
		type: ConnectionType!
		state: ConnectionState!
		setupComplete: Boolean!
		organizationId: ID
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type Directory {
		id: ID!
		name: String!
		type: String!
		state: String!
		externalKey: String!
		organizationId: ID!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type DirectoryList {
		data: [Directory!]!
		listMetadata: ListMetadata!
	}

	type DirectoryUser {
		id: ID!
		idpId: String!
		email: String
		username: String
		firstName: String
		lastName: String
		state: String!
		directoryId: ID!
		organizationId: ID!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type DirectoryUserList {
		data: [DirectoryUser!]!
		listMetadata: ListMetadata!
	}

	type DirectoryGroup {
		id: ID!
		idpId: String!
		name: String!
		directoryId: ID!
		organizationId: ID!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type DirectoryGroupList {
		data: [DirectoryGroup!]!
		listMetadata: ListMetadata!
	}

	type AuditEventActor {
		id: String!
		type: String!
		name: String
	}

	type AuditEvent {
		id: ID!
		action: String!
		occurredAt: DateTime!
		actor: AuditEventActor!
		targets: [String!]!
		data: JSON!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type AuditEventList {
		data: [AuditEvent!]!
		listMetadata: ListMetadata!
	}

	type OrganizationInvitation {
		id: ID!
		email: String!
		roleSlug: String
		status: OrganizationInvitationStatus!
		expiresAt: DateTime!
		createdAt: DateTime!
	}

	input AuditEventFilterInput {
		rangeStart: DateTime!
		rangeEnd: DateTime!
		actions: [String!]
		actorIds: [String!]
		actorNames: [String!]
		targetTypes: [String!]
		targetIds: [String!]
		search: String
	}

	type Query {
		me: User!
		user(id: ID!): User!
		organizations: [UserOrganization!]!
		organization(id: ID!): Organization!
		organizationMemberships(
			limit: Int = 10
			order: PaginationOrder
			search: String
			roleSlug: String
			after: String
			before: String
		): OrganizationMemberList!
		roles: RolesResult!
		role(id: ID!): Role
		permissions(
			limit: Int = 10
			order: PaginationOrder
			search: String
			after: String
			before: String
		): PermissionList!
		effectivePermissions(userId: ID!): [Permission!]!
		sessions: [Session!]!
		passkeys: [Passkey!]!
		ssoConnections: [Connection!]!
		ssoConnection(id: ID!): Connection!
		directoryConnections(
			limit: Int = 10
			order: PaginationOrder
			search: String
			after: String
			before: String
		): DirectoryList!
		directoryConnection(id: ID!): Directory!
		directoryUsers(
			directoryId: ID!
			limit: Int = 10
			order: PaginationOrder
			after: String
			before: String
		): DirectoryUserList!
		directoryGroups(
			directoryId: ID!
			limit: Int = 10
			order: PaginationOrder
			after: String
			before: String
		): DirectoryGroupList!
		auditEvents(
			filter: AuditEventFilterInput!
			limit: Int = 10
			order: PaginationOrder
			after: String
			before: String
		): AuditEventList!
		auditEvent(id: ID!): AuditEvent!
		# Not shipped in the real Client API yet. Matches the agreed shape so the
		# widget can follow a created export until it finishes generating.
		auditLogExport(id: ID!): AuditLogExport!
	}

	# --- Profile ---------------------------------------------------------------

	input UpdateProfileInput {
		firstName: String
		lastName: String
		locale: String
	}

	type ProfileUpdated {
		user: User!
	}

	type InvalidLocale {
		_placeholder: Boolean!
	}

	union UpdateProfileResult = ProfileUpdated | InvalidLocale

	# --- Membership ------------------------------------------------------------

	input InviteUserInput {
		email: String!
		roleSlug: String
		expiresInDays: Int
	}

	type UserInvited {
		invitation: OrganizationInvitation!
	}

	type InvalidInviteeEmail {
		email: String!
	}

	type InvalidInviteeRole {
		roleSlug: String
	}

	type InvalidInvitationExpiry {
		_placeholder: Boolean
	}

	type InviteeAlreadyInvited {
		email: String!
	}

	type InviteeAlreadyMember {
		email: String!
	}

	type InviteeEmailNotDeliverable {
		email: String!
	}

	type OrganizationBlockedFromSendingInvites {
		_placeholder: Boolean
	}

	union InviteUserResult =
		| UserInvited
		| InvalidInviteeEmail
		| InvalidInviteeRole
		| InvalidInvitationExpiry
		| InviteeAlreadyInvited
		| InviteeAlreadyMember
		| InviteeEmailNotDeliverable
		| OrganizationBlockedFromSendingInvites

	input UpdateMemberRoleInput {
		userId: ID!
		roleSlugs: [String!]!
	}

	type MemberRoleUpdated {
		member: OrganizationMember!
	}

	type MemberNotFound {
		userId: ID!
	}

	type RoleNotFound {
		roleSlugs: [String!]!
	}

	union UpdateMemberRoleResult = MemberRoleUpdated | MemberNotFound | RoleNotFound

	input RemoveMemberInput {
		userId: ID!
	}

	type MemberRemoved {
		userId: ID!
	}

	type MemberIsManagedByDirectory {
		userId: ID!
	}

	union RemoveMemberResult = MemberRemoved | MemberNotFound | MemberIsManagedByDirectory

	input RevokeInvitationInput {
		userId: ID!
	}

	type InvitationRevoked {
		invitation: OrganizationInvitation!
	}

	type InvitationNotFound {
		userId: ID!
	}

	type InvitationNotPending {
		userId: ID!
	}

	union RevokeInvitationResult = InvitationRevoked | InvitationNotFound | InvitationNotPending

	input ResendInvitationInput {
		userId: ID!
	}

	type InvitationResent {
		invitation: OrganizationInvitation!
	}

	type InviteeAlreadyAccepted {
		userId: ID!
	}

	type ResendInvitationNotFound {
		userId: ID!
	}

	union ResendInvitationResult =
		| InvitationResent
		| InviteeAlreadyAccepted
		| InviteeEmailNotDeliverable
		| ResendInvitationNotFound

	# --- Passwords -------------------------------------------------------------

	input CreatePasswordInput {
		password: String!
		elevatedAccessToken: String!
	}

	type PasswordCreated {
		success: Boolean!
	}

	type UserAlreadyHasPassword {
		_placeholder: Boolean!
	}

	type PasswordPolicyViolation {
		message: String!
		code: String!
	}

	type ElevatedAccessTokenExpired {
		message: String!
	}

	type ElevatedAccessTokenInvalid {
		message: String!
	}

	union CreatePasswordResult =
		| PasswordCreated
		| UserAlreadyHasPassword
		| PasswordPolicyViolation
		| ElevatedAccessTokenExpired
		| ElevatedAccessTokenInvalid

	input UpdatePasswordInput {
		currentPassword: String!
		newPassword: String!
	}

	type PasswordUpdated {
		success: Boolean!
	}

	type IncorrectPassword {
		_placeholder: Boolean!
	}

	union UpdatePasswordResult = PasswordUpdated | IncorrectPassword | PasswordPolicyViolation

	# --- MFA -------------------------------------------------------------------

	input EnrollTotpInput {
		elevatedAccessToken: String!
	}

	type TotpFactor {
		authenticationFactorId: String!
		authenticationChallengeId: String!
		uri: String!
		secret: String!
		qrCode: String!
	}

	type TotpAlreadyEnrolled {
		_placeholder: Boolean!
	}

	union EnrollTotpResult =
		| TotpFactor
		| TotpAlreadyEnrolled
		| ElevatedAccessTokenExpired
		| ElevatedAccessTokenInvalid

	input VerifyTotpInput {
		authenticationChallengeId: String!
		code: String!
		elevatedAccessToken: String!
	}

	type TotpVerified {
		success: Boolean!
	}

	type TotpVerificationFailed {
		_placeholder: Boolean!
	}

	union VerifyTotpResult =
		| TotpVerified
		| TotpVerificationFailed
		| ElevatedAccessTokenExpired
		| ElevatedAccessTokenInvalid

	input RemoveMfaFactorInput {
		elevatedAccessToken: String!
	}

	type MfaFactorRemoved {
		success: Boolean!
	}

	type NoMfaFactorsEnrolled {
		_placeholder: Boolean!
	}

	union RemoveMfaFactorResult =
		| MfaFactorRemoved
		| NoMfaFactorsEnrolled
		| ElevatedAccessTokenExpired
		| ElevatedAccessTokenInvalid

	# --- Email change ----------------------------------------------------------

	type VerificationCodeSent {
		authenticationChallengeId: ID!
		expiresAt: DateTime!
	}

	type DailyEmailQuotaExceeded {
		message: String!
	}

	union SendVerificationCodeResult = VerificationCodeSent | DailyEmailQuotaExceeded

	input VerifyCurrentEmailInput {
		authenticationChallengeId: ID!
		code: String!
	}

	type CurrentEmailVerified {
		elevatedAccessToken: String!
		expiresAt: String!
	}

	type VerificationCodeExpired {
		message: String!
	}

	type VerificationCodeIncorrect {
		message: String!
	}

	type VerificationCodePreviouslyUsed {
		message: String!
	}

	type VerificationTooManyAttempts {
		message: String!
	}

	union VerifyCurrentEmailResult =
		| CurrentEmailVerified
		| VerificationCodeExpired
		| VerificationCodeIncorrect
		| VerificationCodePreviouslyUsed
		| VerificationTooManyAttempts

	input SendEmailChangeInput {
		elevatedAccessToken: String!
		newEmail: String!
	}

	type EmailChangeSent {
		expiresAt: DateTime!
	}

	type InvalidEmail {
		message: String!
	}

	type EmailNotAvailable {
		message: String!
	}

	type EmailManagedByProvider {
		message: String!
	}

	type EmailChangeNotAvailable {
		message: String!
	}

	type IdentityVerificationExpired {
		message: String!
	}

	type IdentityVerificationInvalid {
		message: String!
	}

	union SendEmailChangeResult =
		| EmailChangeSent
		| InvalidEmail
		| EmailNotAvailable
		| EmailManagedByProvider
		| EmailChangeNotAvailable
		| DailyEmailQuotaExceeded
		| IdentityVerificationExpired
		| IdentityVerificationInvalid

	input ConfirmEmailChangeInput {
		code: String!
		elevatedAccessToken: String!
	}

	type EmailChangeConfirmed {
		elevatedAccessToken: String!
		expiresAt: String!
		user: User!
	}

	type NoPendingEmailChange {
		message: String!
	}

	type EmailChangeCodeExpired {
		message: String!
	}

	type EmailChangeCodeIncorrect {
		message: String!
	}

	type EmailChangeCodePreviouslyUsed {
		message: String!
	}

	type EmailChangeTooManyAttempts {
		message: String!
	}

	union ConfirmEmailChangeResult =
		| EmailChangeConfirmed
		| NoPendingEmailChange
		| EmailChangeCodeExpired
		| EmailChangeCodeIncorrect
		| EmailChangeCodePreviouslyUsed
		| EmailChangeTooManyAttempts
		| EmailNotAvailable
		| EmailManagedByProvider
		| InvalidEmail
		| IdentityVerificationExpired
		| IdentityVerificationInvalid

	# --- Sessions --------------------------------------------------------------

	input RevokeSessionInput {
		sessionId: ID!
	}

	type SessionRevoked {
		session: Session!
	}

	type SessionNotFound {
		sessionId: ID!
	}

	union RevokeSessionResult = SessionRevoked | SessionNotFound

	type AllSessionsRevoked {
		success: Boolean!
	}

	union RevokeAllSessionsResult = AllSessionsRevoked

	# --- Roles -----------------------------------------------------------------

	input CreateRoleInput {
		name: String!
		slug: String
		description: String
		permissions: [String!]
	}

	input UpdateRoleInput {
		id: ID!
		name: String!
		description: String
		permissions: [String!]
	}

	input DeleteRoleInput {
		id: ID!
	}

	type RoleDeleted {
		id: ID!
	}

	input AssignPermissionToRoleInput {
		roleId: ID!
		permissionSlug: String!
	}

	# --- SSO -------------------------------------------------------------------

	input CreateSsoConnectionInput {
		type: ConnectionType!
		name: String
	}

	input UpdateSsoConnectionInput {
		id: ID!
		name: String
	}

	# --- Audit logs ------------------------------------------------------------

	input CreateAuditLogExportInput {
		rangeStart: DateTime!
		rangeEnd: DateTime!
		actions: [String!]
		actorIds: [String!]
		actorNames: [String!]
		targetTypes: [String!]
		targetIds: [String!]
	}

	type AuditLogExport {
		id: ID!
		state: AuditLogExportState!
		# Signed CSV URL, only set once the export is Ready.
		url: String
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type InvalidAuditLogExportDateRange {
		message: String!
	}

	type NoAuditEventsFound {
		message: String!
	}

	union CreateAuditLogExportResult =
		| AuditLogExport
		| InvalidAuditLogExportDateRange
		| NoAuditEventsFound

	type Mutation {
		updateProfile(input: UpdateProfileInput!): UpdateProfileResult!

		inviteUser(input: InviteUserInput!): InviteUserResult!
		updateMemberRole(input: UpdateMemberRoleInput!): UpdateMemberRoleResult!
		removeMember(input: RemoveMemberInput!): RemoveMemberResult!
		revokeInvitation(input: RevokeInvitationInput!): RevokeInvitationResult!
		resendInvitation(input: ResendInvitationInput!): ResendInvitationResult!

		createPassword(input: CreatePasswordInput!): CreatePasswordResult!
		updatePassword(input: UpdatePasswordInput!): UpdatePasswordResult!

		enrollTotp(input: EnrollTotpInput!): EnrollTotpResult!
		verifyTotp(input: VerifyTotpInput!): VerifyTotpResult!
		removeMfaFactor(input: RemoveMfaFactorInput!): RemoveMfaFactorResult!

		sendVerificationCode: SendVerificationCodeResult!
		verifyCurrentEmail(input: VerifyCurrentEmailInput!): VerifyCurrentEmailResult!
		sendEmailChange(input: SendEmailChangeInput!): SendEmailChangeResult!
		confirmEmailChange(input: ConfirmEmailChangeInput!): ConfirmEmailChangeResult!

		revokeSession(input: RevokeSessionInput!): RevokeSessionResult!
		revokeAllSessions: RevokeAllSessionsResult!

		createRole(input: CreateRoleInput!): Role!
		updateRole(input: UpdateRoleInput!): Role!
		deleteRole(input: DeleteRoleInput!): RoleDeleted!
		assignPermissionToRole(input: AssignPermissionToRoleInput!): Role!

		createSsoConnection(input: CreateSsoConnectionInput!): Connection!
		updateSsoConnection(input: UpdateSsoConnectionInput!): Connection!
		deleteSsoConnection(id: ID!): ID!

		createAuditLogExport(input: CreateAuditLogExportInput!): CreateAuditLogExportResult!
	}
`;
