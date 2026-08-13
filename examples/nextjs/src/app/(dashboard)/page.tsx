import { OverviewWidgets } from "@/components/widgets/overview";
import { HydrationBoundary } from "@tanstack/react-query";
import {
	AUDIT_EVENTS_QUERY,
	DIRECTORY_CONNECTIONS_QUERY,
	EFFECTIVE_PERMISSIONS_QUERY,
	ME_QUERY,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	ORGANIZATION_QUERY,
	ROLES_QUERY,
	SSO_CONNECTIONS_QUERY,
} from "@/lib/graphql/operations";
import {
	AUDIT_WINDOW_DAYS,
	overviewAuditEventsVariables,
	overviewAuditRange,
	overviewDirectoriesVariables,
	overviewMembersVariables,
	overviewPermissionsVariables,
} from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { getAppSession } from "@/lib/workos/session";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function OverviewPage() {
	const session = await getAppSession();
	const organizationId = session?.organizationId;
	const auditRange = overviewAuditRange();

	if (organizationId) {
		await prefetchGraphqlQueries([
			{ document: ME_QUERY },
			{ document: ORGANIZATION_QUERY, variables: { id: organizationId } },
			{ document: ORGANIZATION_MEMBERSHIPS_QUERY, variables: overviewMembersVariables() },
			{ document: ROLES_QUERY },
			{ document: SSO_CONNECTIONS_QUERY },
			{ document: DIRECTORY_CONNECTIONS_QUERY, variables: overviewDirectoriesVariables() },
			{
				document: AUDIT_EVENTS_QUERY,
				variables: overviewAuditEventsVariables(auditRange),
			},
			{ document: EFFECTIVE_PERMISSIONS_QUERY, variables: overviewPermissionsVariables() },
		]);
	}

	const navItem = findNavItem("/");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<OverviewWidgets auditRange={auditRange} auditWindowDays={AUDIT_WINDOW_DAYS} />
		</HydrationBoundary>
	);
}
