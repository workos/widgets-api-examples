const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const DIVISIONS: [Intl.RelativeTimeFormatUnit, number][] = [
	["second", 60],
	["minute", 60],
	["hour", 24],
	["day", 7],
	["week", 4.34524],
	["month", 12],
	["year", Number.POSITIVE_INFINITY],
];

export function relativeTime(value: string | null | undefined): string {
	if (!value) {
		return "—";
	}

	let delta = (new Date(value).getTime() - Date.now()) / 1000;
	for (const [unit, amount] of DIVISIONS) {
		if (Math.abs(delta) < amount) {
			return RELATIVE.format(Math.round(delta), unit);
		}
		delta /= amount;
	}
	return "—";
}

const DATE_TIME = new Intl.DateTimeFormat("en", {
	dateStyle: "medium",
	timeStyle: "short",
});

const DATE = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

export function formatDateTime(value: string | null | undefined): string {
	return value ? DATE_TIME.format(new Date(value)) : "—";
}

export function formatDate(value: string | null | undefined): string {
	return value ? DATE.format(new Date(value)) : "—";
}

export function fullName(
	firstName: string | null | undefined,
	lastName: string | null | undefined,
): string | null {
	const name = [firstName, lastName].filter(Boolean).join(" ").trim();
	return name || null;
}

export function displayName(person: {
	firstName?: string | null;
	lastName?: string | null;
	email: string;
}): string {
	return fullName(person.firstName, person.lastName) ?? person.email;
}

const ACTION_LABELS = new Map([
	["user.signed_in", "User signed in"],
	["user.signed_out", "User signed out"],
	["user.organization_deleted", "User organization deleted"],
	["organization_membership.created", "Organization membership created"],
	["organization_membership.updated", "Organization membership updated"],
	["organization_membership.deleted", "Organization membership deleted"],
	["connection.activated", "Connection activated"],
	["connection.deactivated", "Connection deactivated"],
	["dsync.activated", "Directory sync activated"],
	["dsync.user_created", "Directory user created"],
	["user.organization_deleted", "User organization deleted"],
	["organization_membership.created", "Organization membership created"],
	["organization_membership.updated", "Organization membership updated"],
	["organization_membership.deleted", "Organization membership deleted"],
	["connection.activated", "Connection activated"],
	["connection.deactivated", "Connection deactivated"],
	["dsync.activated", "Directory sync activated"],
	["dsync.user_created", "Directory user created"],
	["role.created", "Role created"],
	["role.updated", "Role updated"],
	["api_key.created", "API key created"],
]);

export function humanizeAction(action: string) {
	return ACTION_LABELS.get(action) ?? action;
}

function getBrowser(userAgent: string) {
	if (/Edg\//.test(userAgent)) {
		return "Edge";
	}
	if (/Chrome\//.test(userAgent)) {
		return "Chrome";
	}
	if (/Firefox\//.test(userAgent)) {
		return "Firefox";
	}
	if (/Safari\//.test(userAgent)) {
		return "Safari";
	}
	return null;
}

function getPlatform(userAgent: string) {
	if (/iPhone|iPad/.test(userAgent)) {
		return "iOS";
	}
	if (/Android/.test(userAgent)) {
		return "Android";
	}
	if (/Mac OS X|Macintosh/.test(userAgent)) {
		return "macOS";
	}
	if (/Windows/.test(userAgent)) {
		return "Windows";
	}
	if (/Linux/.test(userAgent)) {
		return "Linux";
	}

	return null;
}

export function describeDevice(userAgent: string | null | undefined): string {
	if (!userAgent) {
		return "Unknown device";
	}

	const browser = getBrowser(userAgent) ?? "Browser";
	const platform = getPlatform(userAgent) ?? "Unknown OS";

	return `${browser} on ${platform}`;
}

const CONNECTION_TYPE_LABELS = new Map([
	["OktaSAML", "Okta SAML"],
	["AzureSAML", "Azure SAML"],
	["GenericSAML", "Generic SAML"],
	["GoogleSAML", "Google SAML"],
	["JumpCloudSAML", "JumpCloud SAML"],
	["PingOneSAML", "PingOne SAML"],
	["EntraIdOIDC", "Entra ID OIDC"],
	["GenericOIDC", "Generic OIDC"],
	["OktaOIDC", "Okta OIDC"],
]);

export function humanizeConnectionType(type: string): string {
	return CONNECTION_TYPE_LABELS.get(type) ?? type;
}
