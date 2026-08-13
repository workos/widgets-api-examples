/**
 * Deterministic fixture data backing demo mode.
 *
 * The shapes here mirror the Client API types exactly, including `__typename` on
 * union members, so the demo executor can resolve unions with graphql-js's default
 * `resolveType`.
 */

export interface DemoConnectedAccount {
	id: string;
	email: string | null;
	firstName: string | null;
	lastName: string | null;
	provider: string;
	profilePictureUrl: string | null;
	lastLoginAt: string | null;
}

export interface DemoUser {
	id: string;
	email: string;
	emailVerified: boolean;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
	mfaEnabled: boolean;
	mfaLastUsedAt: string | null;
	connectedAccounts: DemoConnectedAccount[];
	createdAt: string;
	updatedAt: string;
}

export interface DemoMember {
	id: string;
	email: string;
	emailVerified: boolean;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
	status: "Active" | "Invited" | "InviteExpired" | "InviteRevoked" | "NoInvite";
	lastActivityAt: string | null;
	roles: { slug: string; name: string }[];
	createdAt: string;
	managedByDirectory: boolean;
}

export interface DemoRole {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	isDefault: boolean;
	permissions: string[];
	createdAt: string;
	updatedAt: string;
}

export interface DemoPermission {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	system: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DemoSession {
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
}

export interface DemoConnection {
	id: string;
	name: string;
	type: string;
	state: "Active" | "Inactive" | "Validating" | "Deleting";
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface DemoDirectory {
	id: string;
	name: string;
	type: string;
	state: string;
	externalKey: string;
	organizationId: string;
	createdAt: string;
	updatedAt: string;
}

export interface DemoAuditEvent {
	id: string;
	action: string;
	occurredAt: string;
	actor: { id: string; type: string; name: string | null };
	targets: string[];
	data: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface DemoInvitation {
	id: string;
	userId: string;
	email: string;
	roleSlug: string | null;
	status: "Pending" | "Accepted" | "Expired" | "Revoked";
	expiresAt: string;
	createdAt: string;
}

/**
 * Timestamps are generated relative to process start so the dashboard always shows
 * plausible "3 hours ago" style values rather than a frozen date in the past.
 */
const NOW = Date.now();
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function ago(ms: number): string {
	return new Date(NOW - ms).toISOString();
}

function ahead(ms: number): string {
	return new Date(NOW + ms).toISOString();
}

export const DEMO_ORG_ID = "org_01HZDEMONORTHSTARLABS0001";
export const DEMO_USER_ID = "user_01HZDEMOJORDANREYES000001";

export type DemoDatabase = ReturnType<typeof createDemoDatabase>;

export function createDemoDatabase() {
	const me: DemoUser = {
		id: DEMO_USER_ID,
		email: "jordan.reyes@northstar.dev",
		emailVerified: true,
		firstName: "Jordan",
		lastName: "Reyes",
		profilePictureUrl: null,
		mfaEnabled: false,
		mfaLastUsedAt: null,
		connectedAccounts: [
			{
				id: "conn_acct_01HZDEMOGOOGLE0001",
				email: "jordan.reyes@northstar.dev",
				firstName: "Jordan",
				lastName: "Reyes",
				provider: "GoogleOAuth",
				profilePictureUrl: null,
				lastLoginAt: ago(5 * HOUR),
			},
			{
				id: "conn_acct_01HZDEMOGITHUB0001",
				email: "jordan@users.noreply.github.com",
				firstName: "Jordan",
				lastName: "Reyes",
				provider: "GithubOAuth",
				profilePictureUrl: null,
				lastLoginAt: ago(19 * DAY),
			},
		],
		createdAt: ago(410 * DAY),
		updatedAt: ago(2 * DAY),
	};

	// The example is deliberately single-tenant. A session token is always scoped
	// to one organization, so every widget reads from the token's org rather than
	// offering a tenant picker.
	const organizations = [{ id: DEMO_ORG_ID, name: "Northstar Labs", isCurrent: true }];

	const organization = {
		id: DEMO_ORG_ID,
		name: "Northstar Labs",
		allowProfilesOutsideOrganization: false,
		createdAt: ago(412 * DAY),
		updatedAt: ago(31 * DAY),
	};

	const permissions: DemoPermission[] = [
		["user:read", "Read users", "View user profiles in the organization.", true],
		["user:list", "List users", "List the organization's members.", true],
		["user:invite", "Invite users", "Send invitations to join the organization.", true],
		["user:update", "Update users", "Update member profiles.", true],
		["user:delete", "Remove users", "Remove members from the organization.", true],
		["organization:read", "Read organization", "View organization settings.", true],
		["role:read", "Read roles", "View roles and permissions.", true],
		["role:assign", "Assign roles", "Change a member's role assignments.", true],
		["role:create", "Create roles", "Create new organization roles.", true],
		["role:update", "Update roles", "Modify existing roles.", true],
		["role:delete", "Delete roles", "Delete organization roles.", true],
		["connection:read", "Read SSO connections", "View SSO connections.", true],
		[
			"connection:write",
			"Manage SSO connections",
			"Create, rename, and delete SSO connections.",
			true,
		],
		[
			"directory:read",
			"Read directories",
			"View Directory Sync connections and their contents.",
			true,
		],
		["auditEvent:read", "Read audit events", "Query and export audit log events.", true],
		["apiKey:create", "Create API keys", "Issue API keys.", true],
		["widgets:users-table:manage", "Manage users table widget", "Legacy widget permission.", true],
		["widgets:sso:manage", "Manage SSO widget", "Legacy widget permission.", true],
		["widgets:dsync:manage", "Manage Directory Sync widget", "Legacy widget permission.", true],
		[
			"widgets:audit-log-streaming:manage",
			"Manage audit log streaming widget",
			"Legacy widget permission.",
			true,
		],
		["invoice:read", "Read invoices", "View billing invoices.", false],
		["invoice:write", "Manage invoices", "Create and void invoices.", false],
		[
			"dashboard:publish",
			"Publish dashboards",
			"Publish dashboards to the whole workspace.",
			false,
		],
		["pipeline:run", "Run pipelines", "Trigger data pipeline runs.", false],
	].map(([slug, name, description, system], index) => ({
		id: `perm_01HZDEMO${String(index).padStart(4, "0")}`,
		slug: slug as string,
		name: name as string,
		description: description as string,
		system: system as boolean,
		createdAt: ago(400 * DAY),
		updatedAt: ago(60 * DAY),
	}));

	const roles: DemoRole[] = [
		{
			id: "role_01HZDEMOADMIN000000000001",
			slug: "admin",
			name: "Admin",
			description: "Full access to organization settings, members, and security.",
			isDefault: false,
			permissions: [
				"user:read",
				"user:list",
				"user:invite",
				"user:update",
				"user:delete",
				"organization:read",
				"role:read",
				"role:assign",
				"role:create",
				"role:update",
				"role:delete",
				"connection:read",
				"connection:write",
				"directory:read",
				"auditEvent:read",
				"dashboard:publish",
				"pipeline:run",
			],
			createdAt: ago(412 * DAY),
			updatedAt: ago(90 * DAY),
		},
		{
			id: "role_01HZDEMOMEMBER00000000001",
			slug: "member",
			name: "Member",
			description: "Can use the product and view teammates.",
			isDefault: true,
			permissions: ["user:read", "user:list", "organization:read", "role:read", "pipeline:run"],
			createdAt: ago(412 * DAY),
			updatedAt: ago(120 * DAY),
		},
		{
			id: "role_01HZDEMOBILLING0000000001",
			slug: "billing-admin",
			name: "Billing admin",
			description: "Can manage billing settings and invoices.",
			isDefault: false,
			permissions: ["organization:read", "invoice:read", "invoice:write", "user:list"],
			createdAt: ago(180 * DAY),
			updatedAt: ago(14 * DAY),
		},
		{
			id: "role_01HZDEMOSECURITY000000001",
			slug: "security-analyst",
			name: "Security analyst",
			description: "Read-only access to audit logs, SSO, and directory configuration.",
			isDefault: false,
			permissions: [
				"auditEvent:read",
				"connection:read",
				"directory:read",
				"user:list",
				"role:read",
			],
			createdAt: ago(96 * DAY),
			updatedAt: ago(9 * DAY),
		},
	];

	const members: DemoMember[] = [
		{
			id: DEMO_USER_ID,
			email: "jordan.reyes@northstar.dev",
			emailVerified: true,
			firstName: "Jordan",
			lastName: "Reyes",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(4 * 60_000),
			roles: [{ slug: "admin", name: "Admin" }],
			createdAt: ago(410 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOPRIYANATARAJAN01",
			email: "priya.natarajan@northstar.dev",
			emailVerified: true,
			firstName: "Priya",
			lastName: "Natarajan",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(3 * HOUR),
			roles: [{ slug: "admin", name: "Admin" }],
			createdAt: ago(388 * DAY),
			managedByDirectory: true,
		},
		{
			id: "user_01HZDEMOMARCUSCHEN000001",
			email: "marcus.chen@northstar.dev",
			emailVerified: true,
			firstName: "Marcus",
			lastName: "Chen",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(26 * HOUR),
			roles: [{ slug: "security-analyst", name: "Security analyst" }],
			createdAt: ago(300 * DAY),
			managedByDirectory: true,
		},
		{
			id: "user_01HZDEMOELENAVOLKOVA0001",
			email: "elena.volkova@northstar.dev",
			emailVerified: true,
			firstName: "Elena",
			lastName: "Volkova",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(9 * HOUR),
			roles: [{ slug: "billing-admin", name: "Billing admin" }],
			createdAt: ago(240 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOSAMOKONKWO000001",
			email: "sam.okonkwo@northstar.dev",
			emailVerified: true,
			firstName: "Sam",
			lastName: "Okonkwo",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(2 * DAY),
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(210 * DAY),
			managedByDirectory: true,
		},
		{
			id: "user_01HZDEMOHANNAHKIM00000001",
			email: "hannah.kim@northstar.dev",
			emailVerified: true,
			firstName: "Hannah",
			lastName: "Kim",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(51 * HOUR),
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(150 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMODIEGOMARTINEZ001",
			email: "diego.martinez@northstar.dev",
			emailVerified: true,
			firstName: "Diego",
			lastName: "Martinez",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(11 * DAY),
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(120 * DAY),
			managedByDirectory: true,
		},
		{
			id: "user_01HZDEMOAISHAPATEL0000001",
			email: "aisha.patel@northstar.dev",
			emailVerified: true,
			firstName: "Aisha",
			lastName: "Patel",
			profilePictureUrl: null,
			status: "Active",
			lastActivityAt: ago(6 * HOUR),
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(88 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOTOMASZWOJCIK00001",
			email: "tomasz.wojcik@northstar.dev",
			emailVerified: false,
			firstName: "Tomasz",
			lastName: "Wójcik",
			profilePictureUrl: null,
			status: "Invited",
			lastActivityAt: null,
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(3 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOFREYAOLSEN0000001",
			email: "freya.olsen@northstar.dev",
			emailVerified: false,
			firstName: "Freya",
			lastName: "Olsen",
			profilePictureUrl: null,
			status: "Invited",
			lastActivityAt: null,
			roles: [{ slug: "billing-admin", name: "Billing admin" }],
			createdAt: ago(1 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOOMARHADDAD0000001",
			email: "omar.haddad@contractor.io",
			emailVerified: false,
			firstName: "Omar",
			lastName: "Haddad",
			profilePictureUrl: null,
			status: "InviteExpired",
			lastActivityAt: null,
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(40 * DAY),
			managedByDirectory: false,
		},
		{
			id: "user_01HZDEMOLUCASFERRARI00001",
			email: "lucas.ferrari@northstar.dev",
			emailVerified: false,
			firstName: "Lucas",
			lastName: "Ferrari",
			profilePictureUrl: null,
			status: "InviteRevoked",
			lastActivityAt: null,
			roles: [{ slug: "member", name: "Member" }],
			createdAt: ago(22 * DAY),
			managedByDirectory: false,
		},
	];

	const invitations: DemoInvitation[] = members
		.filter((member) => member.status !== "Active")
		.map((member, index) => ({
			id: `invitation_01HZDEMO${String(index).padStart(4, "0")}`,
			userId: member.id,
			email: member.email,
			roleSlug: member.roles[0]?.slug ?? null,
			status:
				member.status === "Invited"
					? "Pending"
					: member.status === "InviteExpired"
						? "Expired"
						: "Revoked",
			expiresAt: member.status === "Invited" ? ahead(4 * DAY) : ago(2 * DAY),
			createdAt: member.createdAt,
		}));

	const sessions: DemoSession[] = [
		{
			id: "session_01HZDEMOCURRENT0000000001",
			isCurrent: true,
			state: { tag: "Issued", expiresAt: ahead(6 * HOUR) },
			ipAddress: "73.162.11.204",
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
			organizationId: DEMO_ORG_ID,
			lastActivityAt: ago(2 * 60_000),
			currentLocation: { cityName: "San Francisco", countryISOCode: "US" },
			createdAt: ago(5 * HOUR),
			updatedAt: ago(2 * 60_000),
		},
		{
			id: "session_01HZDEMOLAPTOP00000000001",
			isCurrent: false,
			state: { tag: "Issued", expiresAt: ahead(3 * DAY) },
			ipAddress: "98.44.201.17",
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
			organizationId: DEMO_ORG_ID,
			lastActivityAt: ago(2 * DAY),
			currentLocation: { cityName: "Oakland", countryISOCode: "US" },
			createdAt: ago(9 * DAY),
			updatedAt: ago(2 * DAY),
		},
		{
			id: "session_01HZDEMOPHONE000000000001",
			isCurrent: false,
			state: { tag: "Issued", expiresAt: ahead(12 * DAY) },
			ipAddress: "172.58.90.6",
			userAgent:
				"Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
			organizationId: DEMO_ORG_ID,
			lastActivityAt: ago(20 * HOUR),
			currentLocation: { cityName: "San Francisco", countryISOCode: "US" },
			createdAt: ago(30 * DAY),
			updatedAt: ago(20 * HOUR),
		},
		{
			id: "session_01HZDEMOBERLIN00000000001",
			isCurrent: false,
			state: { tag: "Issued", expiresAt: ahead(1 * DAY) },
			ipAddress: "91.63.204.88",
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
			organizationId: DEMO_ORG_ID,
			lastActivityAt: ago(4 * DAY),
			currentLocation: { cityName: "Berlin", countryISOCode: "DE" },
			createdAt: ago(4 * DAY),
			updatedAt: ago(4 * DAY),
		},
	];

	const passkeys = [
		{
			id: "passkey_01HZDEMOMACBOOK000000001",
			lastVerifiedAt: ago(5 * HOUR),
			createdAt: ago(120 * DAY),
			updatedAt: ago(5 * HOUR),
		},
		{
			id: "passkey_01HZDEMOYUBIKEY000000001",
			lastVerifiedAt: ago(46 * DAY),
			createdAt: ago(200 * DAY),
			updatedAt: ago(46 * DAY),
		},
	];

	const ssoConnections: DemoConnection[] = [
		{
			id: "conn_01HZDEMOOKTASAML000000001",
			name: "Okta (production)",
			type: "OktaSAML",
			state: "Active",
			organizationId: DEMO_ORG_ID,
			createdAt: ago(320 * DAY),
			updatedAt: ago(12 * DAY),
		},
		{
			id: "conn_01HZDEMOENTRAOIDC00000001",
			name: "Microsoft Entra ID",
			type: "EntraIdOIDC",
			state: "Validating",
			organizationId: DEMO_ORG_ID,
			createdAt: ago(6 * DAY),
			updatedAt: ago(6 * DAY),
		},
	];

	const directories: DemoDirectory[] = [
		{
			id: "directory_01HZDEMOOKTASCIM00000001",
			name: "Okta SCIM",
			type: "okta scim v2.0",
			state: "linked",
			externalKey: "9CkVTNhCtLIzXKmz",
			organizationId: DEMO_ORG_ID,
			createdAt: ago(318 * DAY),
			updatedAt: ago(1 * HOUR),
		},
		{
			id: "directory_01HZDEMOENTRASCIM0000001",
			name: "Entra ID SCIM",
			type: "azure scim v2.0",
			state: "unlinked",
			externalKey: "Kd83MnQpRt02Lxya",
			organizationId: DEMO_ORG_ID,
			createdAt: ago(15 * DAY),
			updatedAt: ago(15 * DAY),
		},
	];

	const directoryUsers = [
		["Priya", "Natarajan", "priya.natarajan@northstar.dev", "active"],
		["Marcus", "Chen", "marcus.chen@northstar.dev", "active"],
		["Sam", "Okonkwo", "sam.okonkwo@northstar.dev", "active"],
		["Diego", "Martinez", "diego.martinez@northstar.dev", "active"],
		["Nina", "Beaumont", "nina.beaumont@northstar.dev", "active"],
		["Rafael", "Souza", "rafael.souza@northstar.dev", "inactive"],
		["Yuki", "Tanaka", "yuki.tanaka@northstar.dev", "active"],
		["Grace", "Mbeki", "grace.mbeki@northstar.dev", "suspended"],
	].map(([firstName, lastName, email, state], index) => ({
		id: `directory_user_01HZDEMO${String(index).padStart(4, "0")}`,
		idpId: `00u${String(index).padStart(6, "0")}okta`,
		email,
		username: email,
		firstName,
		lastName,
		state,
		directoryId: directories[0].id,
		organizationId: DEMO_ORG_ID,
		createdAt: ago((300 - index * 12) * DAY),
		updatedAt: ago((index + 1) * HOUR),
	}));

	const directoryGroups = ["Engineering", "Security", "Data Platform", "Finance", "Everyone"].map(
		(name, index) => ({
			id: `directory_group_01HZDEMO${String(index).padStart(4, "0")}`,
			idpId: `00g${String(index).padStart(6, "0")}okta`,
			name,
			directoryId: directories[0].id,
			organizationId: DEMO_ORG_ID,
			createdAt: ago((310 - index * 20) * DAY),
			updatedAt: ago((index + 2) * DAY),
		}),
	);

	const auditEvents = buildAuditEvents(members);

	return {
		me,
		organizations,
		organization,
		members,
		invitations,
		roles,
		permissions,
		sessions,
		passkeys,
		ssoConnections,
		directories,
		directoryUsers,
		directoryGroups,
		auditEvents,
		multipleRolesEnabled: false,
		/** Simulates whether the user has a password credential (drives create vs. update). */
		hasPassword: true,
		password: "correct-horse-battery-staple",
		/** In-flight verification + email-change state for the elevated access token flow. */
		challenges: new Map<
			string,
			{ code: string; expiresAt: string; used: boolean; attempts: number }
		>(),
		elevatedTokens: new Map<string, { expiresAt: string }>(),
		pendingEmailChange: null as null | { newEmail: string; code: string; expiresAt: string },
		totpEnrollment: null as null | { challengeId: string; factorId: string; secret: string },
		auditLogExports: [] as {
			id: string;
			state: string;
			url: string | null;
			createdAt: string;
			updatedAt: string;
		}[],
	};
}

const AUDIT_ACTIONS = [
	["user.signed_in", "user"],
	["user.signed_out", "user"],
	["user.organization_deleted", "organization"],
	["organization_membership.created", "organization_membership"],
	["organization_membership.updated", "organization_membership"],
	["organization_membership.deleted", "organization_membership"],
	["connection.activated", "connection"],
	["connection.deactivated", "connection"],
	["dsync.activated", "directory"],
	["dsync.user_created", "directory_user"],
	["role.created", "role"],
	["role.updated", "role"],
	["api_key.created", "api_key"],
] as const;

function buildAuditEvents(members: DemoMember[]): DemoAuditEvent[] {
	const activeMembers = members.filter((member) => member.status === "Active");
	const events: DemoAuditEvent[] = [];

	// A deterministic pseudo-random sequence keeps the demo stable across reloads.
	let seed = 1337;
	const next = (max: number) => {
		seed = (seed * 1103515245 + 12345) % 2147483648;
		return seed % max;
	};

	for (let index = 0; index < 140; index += 1) {
		const [action, targetType] = AUDIT_ACTIONS[next(AUDIT_ACTIONS.length)];
		const actor = activeMembers[next(activeMembers.length)];
		const occurredAt = ago(index * 4 * HOUR + next(3 * HOUR));

		events.push({
			id: `audit_log_event_01HZDEMO${String(index).padStart(4, "0")}`,
			action,
			occurredAt,
			actor: {
				id: actor.id,
				type: "user",
				name: `${actor.firstName} ${actor.lastName}`,
			},
			targets: [`${targetType}:${actor.id}`],
			data: {
				ip_address: `73.162.${next(255)}.${next(255)}`,
				user_agent: "Chrome/131.0.0.0",
				organization_id: DEMO_ORG_ID,
			},
			createdAt: occurredAt,
			updatedAt: occurredAt,
		});
	}

	return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
