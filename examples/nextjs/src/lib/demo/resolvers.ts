import { buildSchema, graphql, type GraphQLFormattedError } from "graphql";

import {
	createDemoDatabase,
	DEMO_ORG_ID,
	type DemoAuditEvent,
	type DemoDatabase,
	type DemoInvitation,
	type DemoMember,
	type DemoRole,
} from "./data";
import { DEMO_VERIFICATION_CODE } from "./constants";
import { clientApiSchema } from "./schema";

export { DEMO_VERIFICATION_CODE };

const schema = buildSchema(clientApiSchema);

/**
 * Next.js reloads modules on every edit in development. Parking the mutable demo
 * state on `globalThis` keeps invites, roles, and revoked sessions from resetting
 * mid-session.
 */
const globalForDemo = globalThis as typeof globalThis & {
	__workosDemoDb?: DemoDatabase;
};

function db(): DemoDatabase {
	globalForDemo.__workosDemoDb ??= createDemoDatabase();
	return globalForDemo.__workosDemoDb;
}

export function resetDemoDatabase(): void {
	globalForDemo.__workosDemoDb = createDemoDatabase();
}

// --- helpers ---------------------------------------------------------------

const MINUTE = 60_000;
const DAY = 86_400_000;

function nowIso(offsetMs = 0): string {
	return new Date(Date.now() + offsetMs).toISOString();
}

function ulid(prefix: string): string {
	return `${prefix}_01HZ${Math.random().toString(36).slice(2, 12).toUpperCase().padEnd(10, "0")}`;
}

function toCsv(events: DemoAuditEvent[]): string {
	const rows = events.map((event) => [
		event.id,
		event.action,
		event.occurredAt,
		event.actor.id,
		event.actor.name ?? "",
		event.targets.join(" "),
	]);
	return [["id", "action", "occurred_at", "actor_id", "actor_name", "targets"], ...rows]
		.map((row) => row.map((field) => `"${field.replaceAll('"', '""')}"`).join(","))
		.join("\n");
}

function encodeCursor(index: number): string {
	return Buffer.from(`offset:${index}`).toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): number | null {
	if (!cursor) return null;
	const decoded = Buffer.from(cursor, "base64url").toString("utf8");
	const match = /^offset:(\d+)$/.exec(decoded);
	return match ? Number(match[1]) : null;
}

type PageArgs = {
	limit?: number | null;
	order?: "Asc" | "Desc" | "Normal" | null;
	after?: string | null;
	before?: string | null;
};

function paginate<T>(items: T[], { limit, order, after, before }: PageArgs) {
	const ordered = order === "Asc" ? [...items].reverse() : items;
	const size = Math.min(Math.max(limit ?? 10, 1), 100);

	const afterIndex = decodeCursor(after);
	const beforeIndex = decodeCursor(before);
	const start =
		afterIndex !== null
			? afterIndex + 1
			: beforeIndex !== null
				? Math.max(beforeIndex - size, 0)
				: 0;

	const data = ordered.slice(start, start + size);
	const end = start + data.length;

	return {
		data,
		listMetadata: {
			after: end < ordered.length ? encodeCursor(end - 1) : null,
			before: start > 0 ? encodeCursor(start) : null,
		},
	};
}

function toGraphqlRole(role: DemoRole) {
	return {
		id: role.id,
		slug: role.slug,
		name: role.name,
		description: role.description,
		isDefault: role.isDefault,
		createdAt: role.createdAt,
		updatedAt: role.updatedAt,
	};
}

function toGraphqlMember(member: DemoMember) {
	const { managedByDirectory: _managedByDirectory, ...rest } = member;
	return rest;
}

function toGraphqlInvitation(invitation: DemoInvitation) {
	const { userId: _userId, ...rest } = invitation;
	return rest;
}

function withSetupComplete<T extends { state: string }>(connection: T) {
	return { ...connection, setupComplete: connection.state === "Active" };
}

/** Mirrors the API's elevated access token check, including the expiry branch. */
function checkElevatedToken(token: string) {
	const record = db().elevatedTokens.get(token);
	if (!record) {
		return {
			__typename: "ElevatedAccessTokenInvalid",
			message: "The elevated access token is invalid.",
		};
	}
	if (new Date(record.expiresAt).getTime() < Date.now()) {
		db().elevatedTokens.delete(token);
		return {
			__typename: "ElevatedAccessTokenExpired",
			message: "The elevated access token has expired. Re-verify to continue.",
		};
	}
	return null;
}

function issueElevatedToken() {
	const token = `eyJhbGciOi.${Math.random().toString(36).slice(2)}.demo`;
	const expiresAt = nowIso(10 * MINUTE);
	db().elevatedTokens.set(token, { expiresAt });
	return { token, expiresAt };
}

// --- root resolvers --------------------------------------------------------

const root = {
	// Queries -----------------------------------------------------------------

	me: () => db().me,

	user: ({ id }: { id: string }) => {
		const member = db().members.find((candidate) => candidate.id === id);
		if (!member) return null;
		return {
			...toGraphqlMember(member),
			connectedAccounts: member.id === db().me.id ? db().me.connectedAccounts : [],
			mfaEnabled: null,
			mfaLastUsedAt: null,
			updatedAt: member.createdAt,
		};
	},

	organizations: () => db().organizations,

	organization: ({ id }: { id: string }) => (id === DEMO_ORG_ID ? db().organization : null),

	organizationMemberships: (
		args: PageArgs & { search?: string | null; roleSlug?: string | null },
	) => {
		let members = db().members;

		if (args.search) {
			const needle = args.search.toLowerCase();
			members = members.filter((member) =>
				[member.firstName, member.lastName, member.email]
					.filter(Boolean)
					.some((field) => field!.toLowerCase().includes(needle)),
			);
		}

		if (args.roleSlug) {
			members = members.filter((member) =>
				member.roles.some((role) => role.slug === args.roleSlug),
			);
		}

		const page = paginate(members, args);
		return { ...page, data: page.data.map(toGraphqlMember) };
	},

	roles: () => ({
		multipleRolesEnabled: db().multipleRolesEnabled,
		roles: db().roles.map(toGraphqlRole),
	}),

	role: ({ id }: { id: string }) => {
		const role = db().roles.find((candidate) => candidate.id === id);
		return role ? toGraphqlRole(role) : null;
	},

	permissions: () => db().permissions,

	effectivePermissions: ({ userId }: { userId?: string | null }) => {
		const targetId = userId ?? db().me.id;
		const member = db().members.find((candidate) => candidate.id === targetId);
		if (!member) return [];

		const slugs = new Set(
			member.roles.flatMap(
				(assigned) => db().roles.find((role) => role.slug === assigned.slug)?.permissions ?? [],
			),
		);
		return db().permissions.filter((permission) => slugs.has(permission.slug));
	},

	sessions: () => db().sessions,

	passkeys: () => db().passkeys,

	ssoConnections: () => db().ssoConnections.map(withSetupComplete),

	ssoConnection: ({ id }: { id: string }) => {
		const connection = db().ssoConnections.find((candidate) => candidate.id === id);
		return connection ? withSetupComplete(connection) : null;
	},

	directoryConnections: (args: PageArgs & { search?: string | null }) => {
		let directories = db().directories;
		if (args.search) {
			const needle = args.search.toLowerCase();
			directories = directories.filter((directory) =>
				directory.name.toLowerCase().includes(needle),
			);
		}
		return paginate(directories, args);
	},

	directoryConnection: ({ id }: { id: string }) =>
		db().directories.find((directory) => directory.id === id) ?? null,

	directoryUsers: ({ directoryId, ...args }: PageArgs & { directoryId: string }) =>
		paginate(
			db().directoryUsers.filter((user) => user.directoryId === directoryId),
			args,
		),

	directoryGroups: ({ directoryId, ...args }: PageArgs & { directoryId: string }) =>
		paginate(
			db().directoryGroups.filter((group) => group.directoryId === directoryId),
			args,
		),

	auditEvents: ({
		filter,
		...args
	}: PageArgs & {
		filter: {
			rangeStart: string;
			rangeEnd: string;
			actions?: string[] | null;
			actorIds?: string[] | null;
			actorNames?: string[] | null;
			targetTypes?: string[] | null;
			targetIds?: string[] | null;
			search?: string | null;
		};
	}) => {
		const start = new Date(filter.rangeStart).getTime();
		const end = new Date(filter.rangeEnd).getTime();

		const events = db().auditEvents.filter((event) => {
			const occurred = new Date(event.occurredAt).getTime();
			if (occurred < start || occurred > end) return false;
			if (filter.actions?.length && !filter.actions.includes(event.action)) return false;
			if (filter.actorIds?.length && !filter.actorIds.includes(event.actor.id)) return false;
			if (filter.actorNames?.length && !filter.actorNames.includes(event.actor.name ?? "")) {
				return false;
			}
			if (
				filter.targetTypes?.length &&
				!event.targets.some((target) => filter.targetTypes!.includes(target.split(":")[0]))
			) {
				return false;
			}
			if (
				filter.targetIds?.length &&
				!event.targets.some((target) => filter.targetIds!.includes(target.split(":")[1]))
			) {
				return false;
			}
			if (filter.search) {
				const needle = filter.search.toLowerCase();
				const haystack = `${event.action} ${event.actor.name ?? ""} ${event.targets.join(" ")}`;
				if (!haystack.toLowerCase().includes(needle)) return false;
			}
			return true;
		});

		return paginate(events, args);
	},

	auditEvent: ({ id }: { id: string }) => db().auditEvents.find((event) => event.id === id) ?? null,

	// Backs the `auditLogExport` field the real Client API has not shipped yet.
	auditLogExport: ({ id }: { id: string }) => {
		const auditLogExport = db().auditLogExports.find((entry) => entry.id === id);
		if (!auditLogExport) {
			throw new Error(`Audit log export ${id} not found.`);
		}
		return auditLogExport;
	},

	// Profile -----------------------------------------------------------------

	updateProfile: ({
		input,
	}: {
		input: { firstName?: string | null; lastName?: string | null; locale?: string | null };
	}) => {
		if (input.locale && !/^[a-z]{2}(-[A-Z]{2})?$/.test(input.locale)) {
			return { __typename: "InvalidLocale", _placeholder: true };
		}

		const state = db();
		if (input.firstName !== undefined && input.firstName !== null) {
			state.me.firstName = input.firstName || null;
		}
		if (input.lastName !== undefined && input.lastName !== null) {
			state.me.lastName = input.lastName || null;
		}
		state.me.updatedAt = nowIso();

		const self = state.members.find((member) => member.id === state.me.id);
		if (self) {
			self.firstName = state.me.firstName;
			self.lastName = state.me.lastName;
		}

		return { __typename: "ProfileUpdated", user: state.me };
	},

	// Membership --------------------------------------------------------------

	inviteUser: ({
		input,
	}: {
		input: { email: string; roleSlug?: string | null; expiresInDays?: number | null };
	}) => {
		const email = input.email.trim().toLowerCase();
		const state = db();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return { __typename: "InvalidInviteeEmail", email };
		}
		if (email.endsWith("@blocked.example")) {
			return { __typename: "InviteeEmailNotDeliverable", email };
		}
		if (input.roleSlug && !state.roles.some((role) => role.slug === input.roleSlug)) {
			return { __typename: "InvalidInviteeRole", roleSlug: input.roleSlug };
		}
		if (input.expiresInDays != null && (input.expiresInDays < 1 || input.expiresInDays > 30)) {
			return { __typename: "InvalidInvitationExpiry", _placeholder: true };
		}

		const existing = state.members.find((member) => member.email.toLowerCase() === email);
		if (existing?.status === "Active") {
			return { __typename: "InviteeAlreadyMember", email };
		}
		if (existing?.status === "Invited") {
			return { __typename: "InviteeAlreadyInvited", email };
		}

		const roleSlug = input.roleSlug ?? state.roles.find((role) => role.isDefault)!.slug;
		const role = state.roles.find((candidate) => candidate.slug === roleSlug)!;
		const userId = ulid("user");
		const expiresAt = nowIso((input.expiresInDays ?? 7) * DAY);

		state.members.unshift({
			id: userId,
			email,
			emailVerified: false,
			firstName: null,
			lastName: null,
			profilePictureUrl: null,
			status: "Invited",
			lastActivityAt: null,
			roles: [{ slug: role.slug, name: role.name }],
			createdAt: nowIso(),
			managedByDirectory: false,
		});

		const invitation: DemoInvitation = {
			id: ulid("invitation"),
			userId,
			email,
			roleSlug: role.slug,
			status: "Pending",
			expiresAt,
			createdAt: nowIso(),
		};
		state.invitations.unshift(invitation);

		return { __typename: "UserInvited", invitation: toGraphqlInvitation(invitation) };
	},

	updateMemberRole: ({ input }: { input: { userId: string; roleSlugs: string[] } }) => {
		const state = db();
		const member = state.members.find((candidate) => candidate.id === input.userId);
		if (!member) {
			return { __typename: "MemberNotFound", userId: input.userId };
		}

		const matched = input.roleSlugs
			.map((slug) => state.roles.find((role) => role.slug === slug))
			.filter((role): role is DemoRole => Boolean(role));

		if (matched.length !== input.roleSlugs.length) {
			return { __typename: "RoleNotFound", roleSlugs: input.roleSlugs };
		}

		const assigned = state.multipleRolesEnabled ? matched : matched.slice(0, 1);
		member.roles = assigned.map((role) => ({ slug: role.slug, name: role.name }));

		return { __typename: "MemberRoleUpdated", member: toGraphqlMember(member) };
	},

	removeMember: ({ input }: { input: { userId: string } }) => {
		const state = db();
		const index = state.members.findIndex((member) => member.id === input.userId);
		if (index === -1) {
			return { __typename: "MemberNotFound", userId: input.userId };
		}
		if (state.members[index].managedByDirectory) {
			return { __typename: "MemberIsManagedByDirectory", userId: input.userId };
		}

		state.members.splice(index, 1);
		return { __typename: "MemberRemoved", userId: input.userId };
	},

	revokeInvitation: ({ input }: { input: { userId: string } }) => {
		const state = db();
		const invitation = state.invitations.find((item) => item.userId === input.userId);
		if (!invitation) {
			return { __typename: "InvitationNotFound", userId: input.userId };
		}
		if (invitation.status !== "Pending") {
			return { __typename: "InvitationNotPending", userId: input.userId };
		}

		invitation.status = "Revoked";
		const member = state.members.find((candidate) => candidate.id === input.userId);
		if (member) member.status = "InviteRevoked";

		return {
			__typename: "InvitationRevoked",
			invitation: toGraphqlInvitation(invitation),
		};
	},

	resendInvitation: ({ input }: { input: { userId: string } }) => {
		const state = db();
		const invitation = state.invitations.find((item) => item.userId === input.userId);
		if (!invitation) {
			return { __typename: "ResendInvitationNotFound", userId: input.userId };
		}
		if (invitation.status === "Accepted") {
			return { __typename: "InviteeAlreadyAccepted", userId: input.userId };
		}
		if (invitation.email.endsWith("@blocked.example")) {
			return { __typename: "InviteeEmailNotDeliverable", email: invitation.email };
		}

		invitation.status = "Pending";
		invitation.expiresAt = nowIso(7 * DAY);
		invitation.createdAt = nowIso();

		const member = state.members.find((candidate) => candidate.id === input.userId);
		if (member) member.status = "Invited";

		return {
			__typename: "InvitationResent",
			invitation: toGraphqlInvitation(invitation),
		};
	},

	// Passwords ---------------------------------------------------------------

	createPassword: ({ input }: { input: { password: string; elevatedAccessToken: string } }) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) return tokenError;

		const state = db();
		if (state.hasPassword) {
			return { __typename: "UserAlreadyHasPassword", _placeholder: true };
		}

		const violation = validatePassword(input.password);
		if (violation) return violation;

		state.hasPassword = true;
		state.password = input.password;
		return { __typename: "PasswordCreated", success: true };
	},

	updatePassword: ({ input }: { input: { currentPassword: string; newPassword: string } }) => {
		const state = db();
		if (input.currentPassword !== state.password) {
			return { __typename: "IncorrectPassword", _placeholder: true };
		}

		const violation = validatePassword(input.newPassword);
		if (violation) return violation;

		if (input.newPassword === state.password) {
			return {
				__typename: "PasswordPolicyViolation",
				message: "This password has already been used.",
				code: "password_reused",
			};
		}

		state.password = input.newPassword;
		return { __typename: "PasswordUpdated", success: true };
	},

	// MFA ---------------------------------------------------------------------

	enrollTotp: ({ input }: { input: { elevatedAccessToken: string } }) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) return tokenError;

		const state = db();
		if (state.me.mfaEnabled) {
			return { __typename: "TotpAlreadyEnrolled", _placeholder: true };
		}

		const secret = "JBSWY3DPEHPK3PXPDEMOSECRET";
		const challengeId = ulid("auth_challenge");
		const factorId = ulid("auth_factor");
		const uri = `otpauth://totp/Northstar%20Labs:${encodeURIComponent(state.me.email)}?secret=${secret}&issuer=Northstar%20Labs`;

		state.totpEnrollment = { challengeId, factorId, secret };

		return {
			__typename: "TotpFactor",
			authenticationFactorId: factorId,
			authenticationChallengeId: challengeId,
			uri,
			secret,
			qrCode: placeholderQrCode(),
		};
	},

	verifyTotp: ({
		input,
	}: {
		input: { authenticationChallengeId: string; code: string; elevatedAccessToken: string };
	}) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) return tokenError;

		const state = db();
		const matchesChallenge = state.totpEnrollment?.challengeId === input.authenticationChallengeId;

		// The demo cannot compute real TOTP codes, so any six-digit code enrolls.
		if (!matchesChallenge || !/^\d{6}$/.test(input.code)) {
			return { __typename: "TotpVerificationFailed", _placeholder: true };
		}

		state.me.mfaEnabled = true;
		state.me.mfaLastUsedAt = nowIso();
		state.totpEnrollment = null;

		return { __typename: "TotpVerified", success: true };
	},

	removeMfaFactor: ({ input }: { input: { elevatedAccessToken: string } }) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) return tokenError;

		const state = db();
		if (!state.me.mfaEnabled) {
			return { __typename: "NoMfaFactorsEnrolled", _placeholder: true };
		}

		state.me.mfaEnabled = false;
		state.me.mfaLastUsedAt = null;
		return { __typename: "MfaFactorRemoved", success: true };
	},

	// Email change ------------------------------------------------------------

	sendVerificationCode: () => {
		const challengeId = ulid("auth_challenge");
		const expiresAt = nowIso(10 * MINUTE);
		db().challenges.set(challengeId, {
			code: DEMO_VERIFICATION_CODE,
			expiresAt,
			used: false,
			attempts: 0,
		});

		return {
			__typename: "VerificationCodeSent",
			authenticationChallengeId: challengeId,
			expiresAt,
		};
	},

	verifyCurrentEmail: ({
		input,
	}: {
		input: { authenticationChallengeId: string; code: string };
	}) => {
		const challenge = db().challenges.get(input.authenticationChallengeId);
		if (!challenge) {
			return {
				__typename: "VerificationCodeExpired",
				message: "This verification code has expired. Request a new one.",
			};
		}
		if (challenge.used) {
			return {
				__typename: "VerificationCodePreviouslyUsed",
				message: "This verification code has already been used.",
			};
		}
		if (new Date(challenge.expiresAt).getTime() < Date.now()) {
			return {
				__typename: "VerificationCodeExpired",
				message: "This verification code has expired. Request a new one.",
			};
		}
		if (challenge.attempts >= 5) {
			return {
				__typename: "VerificationTooManyAttempts",
				message: "Too many attempts. Request a new code.",
			};
		}
		if (challenge.code !== input.code.trim()) {
			challenge.attempts += 1;
			return {
				__typename: "VerificationCodeIncorrect",
				message: "That code is not correct.",
			};
		}

		challenge.used = true;
		const { token, expiresAt } = issueElevatedToken();
		return {
			__typename: "CurrentEmailVerified",
			elevatedAccessToken: token,
			expiresAt,
		};
	},

	sendEmailChange: ({ input }: { input: { elevatedAccessToken: string; newEmail: string } }) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) {
			return tokenError.__typename === "ElevatedAccessTokenExpired"
				? { __typename: "IdentityVerificationExpired", message: tokenError.message }
				: { __typename: "IdentityVerificationInvalid", message: tokenError.message };
		}

		const newEmail = input.newEmail.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
			return { __typename: "InvalidEmail", message: "Enter a valid email address." };
		}

		const state = db();
		if (state.members.some((member) => member.email.toLowerCase() === newEmail)) {
			return {
				__typename: "EmailNotAvailable",
				message: "That email address is already in use.",
			};
		}
		if (newEmail.endsWith("@sso-managed.example")) {
			return {
				__typename: "EmailManagedByProvider",
				message: "This email is managed by your identity provider.",
			};
		}

		const expiresAt = nowIso(10 * MINUTE);
		state.pendingEmailChange = {
			newEmail,
			code: DEMO_VERIFICATION_CODE,
			expiresAt,
		};

		return { __typename: "EmailChangeSent", expiresAt };
	},

	confirmEmailChange: ({ input }: { input: { code: string; elevatedAccessToken: string } }) => {
		const tokenError = checkElevatedToken(input.elevatedAccessToken);
		if (tokenError) {
			return tokenError.__typename === "ElevatedAccessTokenExpired"
				? { __typename: "IdentityVerificationExpired", message: tokenError.message }
				: { __typename: "IdentityVerificationInvalid", message: tokenError.message };
		}

		const state = db();
		const pending = state.pendingEmailChange;
		if (!pending) {
			return {
				__typename: "NoPendingEmailChange",
				message: "There is no email change in progress.",
			};
		}
		if (new Date(pending.expiresAt).getTime() < Date.now()) {
			return {
				__typename: "EmailChangeCodeExpired",
				message: "That code has expired. Start the change again.",
			};
		}
		if (pending.code !== input.code.trim()) {
			return {
				__typename: "EmailChangeCodeIncorrect",
				message: "That code is not correct.",
			};
		}

		state.me.email = pending.newEmail;
		state.me.emailVerified = true;
		state.me.updatedAt = nowIso();

		const self = state.members.find((member) => member.id === state.me.id);
		if (self) self.email = pending.newEmail;

		state.pendingEmailChange = null;
		const { token, expiresAt } = issueElevatedToken();

		return {
			__typename: "EmailChangeConfirmed",
			elevatedAccessToken: token,
			expiresAt,
			user: state.me,
		};
	},

	// Sessions ----------------------------------------------------------------

	revokeSession: ({ input }: { input: { sessionId: string } }) => {
		const state = db();
		const session = state.sessions.find((candidate) => candidate.id === input.sessionId);
		if (!session) {
			return { __typename: "SessionNotFound", sessionId: input.sessionId };
		}

		session.state = { tag: "Revoked", expiresAt: null };
		session.updatedAt = nowIso();
		return { __typename: "SessionRevoked", session };
	},

	revokeAllSessions: () => {
		for (const session of db().sessions) {
			if (session.isCurrent) continue;
			session.state = { tag: "Revoked", expiresAt: null };
			session.updatedAt = nowIso();
		}
		return { __typename: "AllSessionsRevoked", success: true };
	},

	// Roles -------------------------------------------------------------------

	createRole: ({
		input,
	}: {
		input: {
			name: string;
			slug?: string | null;
			description?: string | null;
			permissions?: string[] | null;
		};
	}) => {
		const state = db();
		const slug =
			input.slug?.trim() ||
			input.name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");

		if (state.roles.some((role) => role.slug === slug)) {
			throw new Error(`A role with the slug "${slug}" already exists.`);
		}

		const role: DemoRole = {
			id: ulid("role"),
			slug,
			name: input.name,
			description: input.description ?? null,
			isDefault: false,
			permissions: input.permissions ?? [],
			createdAt: nowIso(),
			updatedAt: nowIso(),
		};
		state.roles.push(role);
		return toGraphqlRole(role);
	},

	updateRole: ({
		input,
	}: {
		input: { id: string; name: string; description?: string | null; permissions?: string[] | null };
	}) => {
		const role = db().roles.find((candidate) => candidate.id === input.id);
		if (!role) throw new Error("Role not found.");

		role.name = input.name;
		role.description = input.description ?? null;
		if (input.permissions) role.permissions = input.permissions;
		role.updatedAt = nowIso();

		for (const member of db().members) {
			member.roles = member.roles.map((assigned) =>
				assigned.slug === role.slug ? { slug: role.slug, name: role.name } : assigned,
			);
		}

		return toGraphqlRole(role);
	},

	deleteRole: ({ input }: { input: { id: string } }) => {
		const state = db();
		const index = state.roles.findIndex((role) => role.id === input.id);
		if (index === -1) throw new Error("Role not found.");
		if (state.roles[index].isDefault) {
			throw new Error("The default role cannot be deleted.");
		}

		const [removed] = state.roles.splice(index, 1);
		const fallback = state.roles.find((role) => role.isDefault)!;
		for (const member of state.members) {
			if (member.roles.some((assigned) => assigned.slug === removed.slug)) {
				member.roles = [{ slug: fallback.slug, name: fallback.name }];
			}
		}

		return { id: removed.id };
	},

	assignPermissionToRole: ({ input }: { input: { roleId: string; permissionSlug: string } }) => {
		const state = db();
		const role = state.roles.find((candidate) => candidate.id === input.roleId);
		if (!role) throw new Error("Role not found.");
		if (!state.permissions.some((p) => p.slug === input.permissionSlug)) {
			throw new Error(`Unknown permission "${input.permissionSlug}".`);
		}

		if (!role.permissions.includes(input.permissionSlug)) {
			role.permissions.push(input.permissionSlug);
			role.updatedAt = nowIso();
		}

		return toGraphqlRole(role);
	},

	// SSO ---------------------------------------------------------------------

	createSsoConnection: ({ input }: { input: { type: string; name?: string | null } }) => {
		const state = db();
		const connection = {
			id: ulid("conn"),
			name: input.name?.trim() || state.organization.name,
			type: input.type,
			state: "Inactive" as const,
			organizationId: DEMO_ORG_ID,
			createdAt: nowIso(),
			updatedAt: nowIso(),
		};
		state.ssoConnections.unshift(connection);
		return withSetupComplete(connection);
	},

	updateSsoConnection: ({ input }: { input: { id: string; name: string } }) => {
		const connection = db().ssoConnections.find((candidate) => candidate.id === input.id);
		if (!connection) throw new Error("entity_not_found");

		connection.name = input.name;
		connection.updatedAt = nowIso();
		return withSetupComplete(connection);
	},

	deleteSsoConnection: ({ id }: { id: string }) => {
		const state = db();
		const index = state.ssoConnections.findIndex((connection) => connection.id === id);
		if (index === -1) throw new Error("entity_not_found");

		state.ssoConnections.splice(index, 1);
		return id;
	},

	// Audit logs --------------------------------------------------------------

	createAuditLogExport: ({ input }: { input: { rangeStart: string; rangeEnd: string } }) => {
		const start = new Date(input.rangeStart).getTime();
		const end = new Date(input.rangeEnd).getTime();

		if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
			return {
				__typename: "InvalidAuditLogExportDateRange",
				message: "rangeStart must be before rangeEnd.",
			};
		}

		const matching = db().auditEvents.filter((event) => {
			const occurred = new Date(event.occurredAt).getTime();
			return occurred >= start && occurred <= end;
		});

		if (matching.length === 0) {
			return {
				__typename: "NoAuditEventsFound",
				message: "No audit events matched the requested filters.",
			};
		}

		const auditLogExport = {
			id: ulid("audit_log_export"),
			state: "Pending",
			url: null as string | null,
			createdAt: nowIso(),
			updatedAt: nowIso(),
		};
		db().auditLogExports.push(auditLogExport);

		// Exports are asynchronous in the real API; approximate that with a short delay.
		// The real API hands back a signed URL; a data URL keeps the download working
		// offline without needing somewhere to host the file.
		setTimeout(() => {
			auditLogExport.state = "Ready";
			auditLogExport.url = `data:text/csv;charset=utf-8,${encodeURIComponent(toCsv(matching))}`;
			auditLogExport.updatedAt = nowIso();
		}, 4000);

		return { __typename: "AuditLogExport", ...auditLogExport };
	},
};

function validatePassword(password: string) {
	if (password.length < 8) {
		return {
			__typename: "PasswordPolicyViolation",
			message: "Passwords must be at least 8 characters long.",
			code: "password_too_short",
		};
	}
	if (password.length > 256) {
		return {
			__typename: "PasswordPolicyViolation",
			message: "Passwords must be shorter than 256 characters.",
			code: "password_too_long",
		};
	}
	if (password.toLowerCase().includes(db().me.email.split("@")[0].toLowerCase())) {
		return {
			__typename: "PasswordPolicyViolation",
			message: "Passwords cannot contain your email address.",
			code: "password_contains_email",
		};
	}
	if (["password", "12345678", "qwertyui"].includes(password.toLowerCase())) {
		return {
			__typename: "PasswordPolicyViolation",
			message: "This password has appeared in a data breach.",
			code: "password_pwned",
		};
	}
	return null;
}

function placeholderQrCode(): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="#fff"/><text x="80" y="76" font-family="system-ui" font-size="13" text-anchor="middle" fill="#71717a">Demo mode</text><text x="80" y="94" font-family="system-ui" font-size="11" text-anchor="middle" fill="#a1a1aa">no scannable QR</text></svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export type DemoExecutionResult = {
	data?: unknown;
	errors?: readonly GraphQLFormattedError[];
};

export async function executeDemoOperation(params: {
	query: string;
	variables?: Record<string, unknown> | null;
	operationName?: string | null;
}): Promise<DemoExecutionResult> {
	const result = await graphql({
		schema,
		source: params.query,
		rootValue: root,
		variableValues: params.variables ?? undefined,
		operationName: params.operationName ?? undefined,
	});

	return {
		data: result.data,
		errors: result.errors?.map((error) => ({
			message: error.message,
			path: error.path,
			locations: error.locations,
		})) as readonly GraphQLFormattedError[] | undefined,
	};
}
