import { gql } from "@/lib/graphql/gql";

/**
 * Every operation the example issues against `POST /client/graphql`.
 *
 * Documents live in one module so the "API activity" panel and the per-widget
 * "View query" disclosures can show the same text that goes over the wire.
 */

// --- Fragments -------------------------------------------------------------

export const USER_FIELDS = gql`
	fragment UserFields on User {
		id
		email
		emailVerified
		firstName
		lastName
		profilePictureUrl
		createdAt
		updatedAt
	}
`;

export const ROLE_FIELDS = gql`
	fragment RoleFields on Role {
		id
		slug
		name
		description
		isDefault
		createdAt
		updatedAt
	}
`;

export const MEMBER_FIELDS = gql`
	fragment MemberFields on OrganizationMember {
		id
		email
		emailVerified
		firstName
		lastName
		profilePictureUrl
		status
		lastActivityAt
		createdAt
		roles {
			slug
			name
		}
	}
`;

export const CONNECTION_FIELDS = gql`
	fragment ConnectionFields on Connection {
		id
		name
		type
		state
		setupComplete
		organizationId
		createdAt
		updatedAt
	}
`;

const DIRECTORY_CONNECTION_FIELDS = gql`
	fragment DirectoryConnectionFields on Directory {
		id
		name
		type
		state
		externalKey
		organizationId
		createdAt
		updatedAt
	}
`;

export const INVITATION_FIELDS = gql`
	fragment InvitationFields on OrganizationInvitation {
		id
		email
		roleSlug
		status
		expiresAt
		createdAt
	}
`;

// --- Queries ---------------------------------------------------------------

export const ME_QUERY = gql`
	query Me {
		me {
			...UserFields
			mfaEnabled
			mfaLastUsedAt
			connectedAccounts {
				id
				email
				firstName
				lastName
				provider
				profilePictureUrl
				lastLoginAt
			}
		}
	}
	${USER_FIELDS}
`;

export const USER_QUERY = gql`
	query GetUser($id: ID!) {
		user(id: $id) {
			...UserFields
			connectedAccounts {
				id
				provider
				email
			}
		}
	}
	${USER_FIELDS}
`;

export const ORGANIZATIONS_QUERY = gql`
	query Organizations {
		organizations {
			id
			name
			isCurrent
		}
	}
`;

export const ORGANIZATION_QUERY = gql`
	query GetOrganization($id: ID!) {
		organization(id: $id) {
			id
			name
			allowProfilesOutsideOrganization
			createdAt
			updatedAt
		}
	}
`;

export const ORGANIZATION_MEMBERSHIPS_QUERY = gql`
	query OrganizationMemberships(
		$limit: Int
		$order: PaginationOrder
		$search: String
		$roleSlug: String
		$after: String
		$before: String
	) {
		organizationMemberships(
			limit: $limit
			order: $order
			search: $search
			roleSlug: $roleSlug
			after: $after
			before: $before
		) {
			data {
				...MemberFields
			}
			listMetadata {
				after
				before
			}
		}
	}
	${MEMBER_FIELDS}
`;

export const ROLES_QUERY = gql`
	query Roles {
		roles {
			multipleRolesEnabled
			roles {
				...RoleFields
			}
		}
	}
	${ROLE_FIELDS}
`;

export const ROLE_QUERY = gql`
	query GetRole($id: ID!) {
		role(id: $id) {
			...RoleFields
		}
	}
	${ROLE_FIELDS}
`;

export const PERMISSIONS_QUERY = gql`
	query Permissions {
		permissions {
			id
			slug
			name
			description
			system
			createdAt
			updatedAt
		}
	}
`;

export const EFFECTIVE_PERMISSIONS_QUERY = gql`
	query EffectivePermissions($userId: ID) {
		effectivePermissions(userId: $userId) {
			id
			slug
			name
			description
			system
		}
	}
`;

export const SESSIONS_QUERY = gql`
	query Sessions {
		sessions {
			id
			isCurrent
			state {
				tag
				expiresAt
			}
			ipAddress
			userAgent
			organizationId
			lastActivityAt
			currentLocation {
				cityName
				countryISOCode
			}
			createdAt
			updatedAt
		}
	}
`;

export const PASSKEYS_QUERY = gql`
	query Passkeys {
		passkeys {
			id
			lastVerifiedAt
			createdAt
			updatedAt
		}
	}
`;

export const SSO_CONNECTIONS_QUERY = gql`
	query SsoConnections {
		ssoConnections {
			...ConnectionFields
		}
	}
	${CONNECTION_FIELDS}
`;

export const SSO_CONNECTION_QUERY = gql`
	query GetSsoConnection($id: ID!) {
		ssoConnection(id: $id) {
			...ConnectionFields
		}
	}
	${CONNECTION_FIELDS}
`;

export const DIRECTORY_CONNECTION_QUERY = gql`
	query GetDirectoryConnection($id: ID!) {
		directoryConnection(id: $id) {
			...DirectoryConnectionFields
		}
	}
	${DIRECTORY_CONNECTION_FIELDS}
`;

export const DIRECTORY_CONNECTIONS_QUERY = gql`
	query DirectoryConnections($limit: Int, $order: PaginationOrder, $search: String) {
		directoryConnections(limit: $limit, order: $order, search: $search) {
			data {
				...DirectoryConnectionFields
			}
			listMetadata {
				after
				before
			}
		}
	}
	${DIRECTORY_CONNECTION_FIELDS}
`;

export const DIRECTORY_USERS_QUERY = gql`
	query DirectoryUsers($directoryId: ID!, $limit: Int, $after: String) {
		directoryUsers(directoryId: $directoryId, limit: $limit, after: $after) {
			data {
				id
				idpId
				email
				username
				firstName
				lastName
				state
				directoryId
				organizationId
				createdAt
				updatedAt
			}
			listMetadata {
				after
				before
			}
		}
	}
`;

export const DIRECTORY_GROUPS_QUERY = gql`
	query DirectoryGroups($directoryId: ID!, $limit: Int, $after: String) {
		directoryGroups(directoryId: $directoryId, limit: $limit, after: $after) {
			data {
				id
				idpId
				name
				directoryId
				organizationId
				createdAt
				updatedAt
			}
			listMetadata {
				after
				before
			}
		}
	}
`;

export const AUDIT_EVENTS_QUERY = gql`
	query AuditEvents(
		$filter: AuditEventFilter!
		$limit: Int
		$order: PaginationOrder
		$after: String
	) {
		auditEvents(filter: $filter, limit: $limit, order: $order, after: $after) {
			data {
				id
				action
				occurredAt
				targets
				data
				actor {
					id
					type
					name
				}
				createdAt
				updatedAt
			}
			listMetadata {
				after
				before
			}
		}
	}
`;

export const AUDIT_EVENT_QUERY = gql`
	query GetAuditEvent($id: ID!) {
		auditEvent(id: $id) {
			id
			action
			occurredAt
			targets
			data
			actor {
				id
				type
				name
			}
		}
	}
`;

/**
 * Not shipped in the real Client API yet, so this runs against demo mode only and
 * will fail schema validation in live mode. `createAuditLogExport` returns before
 * the export is generated, so the widget follows it here until `state` settles.
 */
export const AUDIT_LOG_EXPORT_QUERY = gql`
	query GetAuditLogExport($id: ID!) {
		auditLogExport(id: $id) {
			id
			state
			url
		}
	}
`;

// --- Profile mutations -----------------------------------------------------

export const UPDATE_PROFILE_MUTATION = gql`
	mutation UpdateProfile($input: UpdateProfileInput!) {
		updateProfile(input: $input) {
			__typename
			... on ProfileUpdated {
				user {
					...UserFields
				}
			}
			... on InvalidLocale {
				_placeholder
			}
		}
	}
	${USER_FIELDS}
`;

// --- Membership mutations --------------------------------------------------

export const INVITE_USER_MUTATION = gql`
	mutation InviteUser($input: InviteUserInput!) {
		inviteUser(input: $input) {
			__typename
			... on UserInvited {
				invitation {
					...InvitationFields
				}
			}
			... on InvalidInviteeEmail {
				email
			}
			... on InvalidInviteeRole {
				roleSlug
			}
			... on InvalidInvitationExpiry {
				_placeholder
			}
			... on InviteeAlreadyInvited {
				email
			}
			... on InviteeAlreadyMember {
				email
			}
			... on InviteeEmailNotDeliverable {
				email
			}
			... on OrganizationBlockedFromSendingInvites {
				_placeholder
			}
		}
	}
	${INVITATION_FIELDS}
`;

export const UPDATE_MEMBER_ROLE_MUTATION = gql`
	mutation UpdateMemberRole($input: UpdateMemberRoleInput!) {
		updateMemberRole(input: $input) {
			__typename
			... on MemberRoleUpdated {
				member {
					...MemberFields
				}
			}
			... on MemberNotFound {
				userId
			}
			... on RoleNotFound {
				roleSlugs
			}
		}
	}
	${MEMBER_FIELDS}
`;

export const REMOVE_MEMBER_MUTATION = gql`
	mutation RemoveMember($input: RemoveMemberInput!) {
		removeMember(input: $input) {
			__typename
			... on MemberRemoved {
				userId
			}
			... on MemberNotFound {
				userId
			}
			... on MemberIsManagedByDirectory {
				userId
			}
		}
	}
`;

export const REVOKE_INVITATION_MUTATION = gql`
	mutation RevokeInvitation($input: RevokeInvitationInput!) {
		revokeInvitation(input: $input) {
			__typename
			... on InvitationRevoked {
				invitation {
					...InvitationFields
				}
			}
			... on InvitationNotFound {
				userId
			}
			... on InvitationNotPending {
				userId
			}
		}
	}
	${INVITATION_FIELDS}
`;

export const RESEND_INVITATION_MUTATION = gql`
	mutation ResendInvitation($input: ResendInvitationInput!) {
		resendInvitation(input: $input) {
			__typename
			... on InvitationResent {
				invitation {
					...InvitationFields
				}
			}
			... on InviteeAlreadyAccepted {
				userId
			}
			... on InviteeEmailNotDeliverable {
				email
			}
			... on ResendInvitationNotFound {
				userId
			}
		}
	}
	${INVITATION_FIELDS}
`;

// --- Password mutations ----------------------------------------------------

export const CREATE_PASSWORD_MUTATION = gql`
	mutation CreatePassword($input: CreatePasswordInput!) {
		createPassword(input: $input) {
			__typename
			... on PasswordCreated {
				success
			}
			... on UserAlreadyHasPassword {
				_placeholder
			}
			... on PasswordPolicyViolation {
				message
				code
			}
			... on ElevatedAccessTokenExpired {
				message
			}
			... on ElevatedAccessTokenInvalid {
				message
			}
		}
	}
`;

export const UPDATE_PASSWORD_MUTATION = gql`
	mutation UpdatePassword($input: UpdatePasswordInput!) {
		updatePassword(input: $input) {
			__typename
			... on PasswordUpdated {
				success
			}
			... on IncorrectPassword {
				_placeholder
			}
			... on PasswordPolicyViolation {
				message
				code
			}
		}
	}
`;

// --- MFA mutations ---------------------------------------------------------

export const ENROLL_TOTP_MUTATION = gql`
	mutation EnrollTotp($input: EnrollTotpInput!) {
		enrollTotp(input: $input) {
			__typename
			... on TotpFactor {
				authenticationFactorId
				authenticationChallengeId
				uri
				secret
				qrCode
			}
			... on TotpAlreadyEnrolled {
				_placeholder
			}
			... on ElevatedAccessTokenExpired {
				message
			}
			... on ElevatedAccessTokenInvalid {
				message
			}
		}
	}
`;

export const VERIFY_TOTP_MUTATION = gql`
	mutation VerifyTotp($input: VerifyTotpInput!) {
		verifyTotp(input: $input) {
			__typename
			... on TotpVerified {
				success
			}
			... on TotpVerificationFailed {
				_placeholder
			}
			... on ElevatedAccessTokenExpired {
				message
			}
			... on ElevatedAccessTokenInvalid {
				message
			}
		}
	}
`;

export const REMOVE_MFA_FACTOR_MUTATION = gql`
	mutation RemoveMfaFactor($input: RemoveMfaFactorInput!) {
		removeMfaFactor(input: $input) {
			__typename
			... on MfaFactorRemoved {
				success
			}
			... on NoMfaFactorsEnrolled {
				_placeholder
			}
			... on ElevatedAccessTokenExpired {
				message
			}
			... on ElevatedAccessTokenInvalid {
				message
			}
		}
	}
`;

// --- Email change mutations ------------------------------------------------

export const SEND_VERIFICATION_CODE_MUTATION = gql`
	mutation SendVerificationCode {
		sendVerificationCode {
			__typename
			... on VerificationCodeSent {
				authenticationChallengeId
				expiresAt
			}
			... on DailyEmailQuotaExceeded {
				message
			}
		}
	}
`;

export const VERIFY_CURRENT_EMAIL_MUTATION = gql`
	mutation VerifyCurrentEmail($input: VerifyCurrentEmailInput!) {
		verifyCurrentEmail(input: $input) {
			__typename
			... on CurrentEmailVerified {
				elevatedAccessToken
				expiresAt
			}
			... on VerificationCodeExpired {
				message
			}
			... on VerificationCodeIncorrect {
				message
			}
			... on VerificationCodePreviouslyUsed {
				message
			}
			... on VerificationTooManyAttempts {
				message
			}
		}
	}
`;

export const SEND_EMAIL_CHANGE_MUTATION = gql`
	mutation SendEmailChange($input: SendEmailChangeInput!) {
		sendEmailChange(input: $input) {
			__typename
			... on EmailChangeSent {
				expiresAt
			}
			... on InvalidEmail {
				message
			}
			... on EmailNotAvailable {
				message
			}
			... on EmailManagedByProvider {
				message
			}
			... on EmailChangeNotAvailable {
				message
			}
			... on DailyEmailQuotaExceeded {
				message
			}
			... on IdentityVerificationExpired {
				message
			}
			... on IdentityVerificationInvalid {
				message
			}
		}
	}
`;

export const CONFIRM_EMAIL_CHANGE_MUTATION = gql`
	mutation ConfirmEmailChange($input: ConfirmEmailChangeInput!) {
		confirmEmailChange(input: $input) {
			__typename
			... on EmailChangeConfirmed {
				elevatedAccessToken
				expiresAt
				user {
					id
					email
				}
			}
			... on NoPendingEmailChange {
				message
			}
			... on EmailChangeCodeExpired {
				message
			}
			... on EmailChangeCodeIncorrect {
				message
			}
			... on EmailChangeCodePreviouslyUsed {
				message
			}
			... on EmailChangeTooManyAttempts {
				message
			}
			... on EmailNotAvailable {
				message
			}
			... on EmailManagedByProvider {
				message
			}
			... on InvalidEmail {
				message
			}
			... on IdentityVerificationExpired {
				message
			}
			... on IdentityVerificationInvalid {
				message
			}
		}
	}
`;

// --- Session mutations -----------------------------------------------------

export const REVOKE_SESSION_MUTATION = gql`
	mutation RevokeSession($input: RevokeSessionInput!) {
		revokeSession(input: $input) {
			__typename
			... on SessionRevoked {
				session {
					id
					state {
						tag
						expiresAt
					}
				}
			}
			... on SessionNotFound {
				sessionId
			}
		}
	}
`;

export const REVOKE_ALL_SESSIONS_MUTATION = gql`
	mutation RevokeAllSessions {
		revokeAllSessions {
			__typename
			... on AllSessionsRevoked {
				success
			}
		}
	}
`;

// --- Role mutations --------------------------------------------------------

export const CREATE_ROLE_MUTATION = gql`
	mutation CreateRole($input: CreateRoleInput!) {
		createRole(input: $input) {
			...RoleFields
		}
	}
	${ROLE_FIELDS}
`;

export const UPDATE_ROLE_MUTATION = gql`
	mutation UpdateRole($input: UpdateRoleInput!) {
		updateRole(input: $input) {
			...RoleFields
		}
	}
	${ROLE_FIELDS}
`;

export const DELETE_ROLE_MUTATION = gql`
	mutation DeleteRole($input: DeleteRoleInput!) {
		deleteRole(input: $input) {
			id
		}
	}
`;

export const ASSIGN_PERMISSION_TO_ROLE_MUTATION = gql`
	mutation AssignPermissionToRole($input: AssignPermissionToRoleInput!) {
		assignPermissionToRole(input: $input) {
			...RoleFields
		}
	}
	${ROLE_FIELDS}
`;

// --- SSO mutations ---------------------------------------------------------

export const CREATE_SSO_CONNECTION_MUTATION = gql`
	mutation CreateSsoConnection($input: CreateSsoConnectionInput!) {
		createSsoConnection(input: $input) {
			...ConnectionFields
		}
	}
	${CONNECTION_FIELDS}
`;

export const UPDATE_SSO_CONNECTION_MUTATION = gql`
	mutation UpdateSsoConnection($input: UpdateSsoConnectionInput!) {
		updateSsoConnection(input: $input) {
			...ConnectionFields
		}
	}
	${CONNECTION_FIELDS}
`;

export const DELETE_SSO_CONNECTION_MUTATION = gql`
	mutation DeleteSsoConnection($id: ID!) {
		deleteSsoConnection(id: $id)
	}
`;

// --- Audit log mutations ---------------------------------------------------

export const CREATE_AUDIT_LOG_EXPORT_MUTATION = gql`
	mutation CreateAuditLogExport($input: CreateAuditLogExportInput!) {
		createAuditLogExport(input: $input) {
			__typename
			... on AuditLogExport {
				id
				state
			}
			... on InvalidAuditLogExportDateRange {
				message
			}
			... on NoAuditEventsFound {
				message
			}
		}
	}
`;
