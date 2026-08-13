"use client";

import { useGraphqlQuery as useQuery } from "@/lib/graphql/hooks";

import { ORGANIZATIONS_QUERY } from "@/lib/graphql/operations";
import type { OrganizationsQueryResult } from "@/lib/graphql/types";

import styles from "./organization-label.module.css";

/**
 * The organization the token is scoped to, read through the Client API itself.
 * `organizations` is session-token-only and marks the active org with `isCurrent`.
 */
export function OrganizationLabel() {
	const { data, isPending: loading } = useQuery<OrganizationsQueryResult>(ORGANIZATIONS_QUERY);

	if (loading) {
		return <span className={styles.placeholder} />;
	}

	const current =
		data?.organizations.find((organization) => organization.isCurrent) ?? data?.organizations[0];

	return <>{current?.name ?? "No organization"}</>;
}
