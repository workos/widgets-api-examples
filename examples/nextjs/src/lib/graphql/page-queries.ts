/**
 * Default variables for each page's primary queries.
 * Shared by server prefetch and client widgets so cache keys stay aligned.
 */

export const AUDIT_WINDOW_DAYS = 30;

export function membersPageVariables() {
	return {
		limit: 10,
		order: "Desc" as const,
		search: null,
		roleSlug: null,
		after: null as string | null,
	};
}

export function rolesMembersVariables() {
	return {
		limit: 50,
		order: "Desc" as const,
	};
}

export function rolesEffectiveVariables(userId: string) {
	return {
		userId,
	};
}

export function rolesPermissionsVariables() {
	return {
		limit: 100,
	};
}

export function directoryPageVariables() {
	return {
		limit: 25,
		search: null as string | null,
	};
}

export function directoryUsersVariables(directoryId: string) {
	return {
		directoryId,
		limit: 25,
	};
}

export function directoryGroupsVariables(directoryId: string) {
	return {
		directoryId,
		limit: 25,
	};
}

/** Merged variables for the composed overview operation; each root field needs its own names. */
export function overviewVariables() {
	return {
		memberLimit: 100,
		memberOrder: "Desc" as const,
		directoryLimit: 10,
	};
}

/**
 * datetime-local values for the audit logs filter defaults.
 * Stored as UTC (`toISOString` slice) so server prefetch and client hooks share keys.
 */
export function defaultAuditRangeInputs(now = new Date()) {
	const end = new Date(now);
	const start = new Date(end.getTime() - AUDIT_WINDOW_DAYS * 86_400_000);
	return {
		rangeStart: toUtcDateTimeLocalValue(start),
		rangeEnd: toUtcDateTimeLocalValue(end),
	};
}

export function auditEventsVariables(range: {
	rangeStart: string;
	rangeEnd: string;
	search?: string;
	actions?: string;
	after?: string | null;
}) {
	const actions = (range.actions ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);

	return {
		filter: {
			rangeStart: fromUtcDateTimeLocalValue(range.rangeStart),
			rangeEnd: fromUtcDateTimeLocalValue(range.rangeEnd),
			...(range.search?.trim() ? { search: range.search.trim() } : {}),
			...(actions.length ? { actions } : {}),
		},
		limit: 25,
		order: "Desc" as const,
		after: range.after ?? null,
	};
}

export function overviewAuditEventsVariables(range: { rangeStart: string; rangeEnd: string }) {
	return {
		filter: {
			rangeStart: range.rangeStart,
			rangeEnd: range.rangeEnd,
		},
		limit: 6,
		order: "Desc" as const,
	};
}

/** ISO range for overview's recent-activity card; computed once on the server and passed through. */
export function overviewAuditRange(now = new Date()) {
	return {
		rangeStart: new Date(now.getTime() - AUDIT_WINDOW_DAYS * 86_400_000).toISOString(),
		rangeEnd: now.toISOString(),
	};
}

function toUtcDateTimeLocalValue(date: Date) {
	return date.toISOString().slice(0, 16);
}

/** Parse a UTC datetime-local string back to ISO, independent of host timezone. */
function fromUtcDateTimeLocalValue(value: string) {
	if (/Z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) {
		return new Date(value).toISOString();
	}
	return new Date(`${value}:00.000Z`).toISOString();
}
