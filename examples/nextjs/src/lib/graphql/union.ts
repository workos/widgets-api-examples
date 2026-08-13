import type { UnionResult } from "@/lib/graphql/types";

/**
 * Client API mutations return a union whose first member is the success case and
 * whose remaining members describe specific, expected failures. Nothing is thrown,
 * so the UI branches on `__typename`.
 *
 * This maps the failure members to copy an end user can act on. Members that carry
 * a `message` field defer to the server's wording.
 */
const MESSAGES: Record<string, string> = {
	// Profile
	InvalidLocale: "That locale is not a valid BCP 47 language tag.",

	// Invitations and membership
	InvalidInviteeEmail: "That email address is not valid.",
	InvalidInviteeRole: "That role does not exist in this organization.",
	InvalidInvitationExpiry: "Invitations must expire between 1 and 30 days from now.",
	InviteeAlreadyInvited: "That person has already been invited.",
	InviteeAlreadyMember: "That person is already a member of this organization.",
	InviteeEmailNotDeliverable:
		"That email domain has no deliverable mail records, so the invitation cannot be sent.",
	OrganizationBlockedFromSendingInvites:
		"This organization is currently blocked from sending invitations.",
	MemberNotFound: "That member is no longer part of this organization.",
	RoleNotFound: "One or more of those roles no longer exist.",
	MemberIsManagedByDirectory:
		"This member is provisioned by your directory. Remove them in your identity provider instead.",
	InvitationNotFound: "No invitation was found for that member.",
	InvitationNotPending: "That invitation is no longer pending.",
	InviteeAlreadyAccepted: "That invitation has already been accepted.",
	ResendInvitationNotFound: "No invitation was found to resend.",

	// Passwords
	UserAlreadyHasPassword: "This account already has a password.",
	IncorrectPassword: "Your current password is not correct.",

	// MFA
	TotpAlreadyEnrolled: "An authenticator app is already enrolled.",
	TotpVerificationFailed: "That code did not match. Try the next one from your app.",
	NoMfaFactorsEnrolled: "There is no authenticator app to remove.",

	// Sessions
	SessionNotFound: "That session no longer exists.",

	// Email change
	NoPendingEmailChange: "There is no email change in progress.",
};

const SUCCESS_TYPES = new Set([
	"ProfileUpdated",
	"UserInvited",
	"MemberRoleUpdated",
	"MemberRemoved",
	"InvitationRevoked",
	"InvitationResent",
	"PasswordCreated",
	"PasswordUpdated",
	"TotpFactor",
	"TotpVerified",
	"MfaFactorRemoved",
	"VerificationCodeSent",
	"CurrentEmailVerified",
	"EmailChangeSent",
	"EmailChangeConfirmed",
	"SessionRevoked",
	"AllSessionsRevoked",
	"AuditLogExport",
]);

export function isSuccess(result: UnionResult | null | undefined): boolean {
	return Boolean(result && SUCCESS_TYPES.has(result.__typename));
}

/**
 * Returns a human-readable error for a union member, or `null` when the member is
 * the success case.
 */
export function unionErrorMessage(result: UnionResult | null | undefined): string | null {
	if (!result || isSuccess(result)) {
		return null;
	}

	if (typeof result.message === "string" && result.message) {
		return result.message;
	}

	return MESSAGES[result.__typename] ?? `The request failed with ${result.__typename}.`;
}

/** Narrows a union result to a specific member. */
export function isType<T extends string>(
	result: UnionResult | null | undefined,
	typename: T,
): result is UnionResult<T> {
	return result?.__typename === typename;
}
