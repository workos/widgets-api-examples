import { OverviewWidgets } from "@/components/widgets/overview";
import { HydrationBoundary } from "@tanstack/react-query";
import { AUDIT_EVENTS_QUERY, ORGANIZATION_QUERY, OVERVIEW_QUERY } from "@/lib/graphql/operations";
import {
	AUDIT_WINDOW_DAYS,
	overviewAuditEventsVariables,
	overviewAuditRange,
	overviewVariables,
} from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { getAppSession } from "@/lib/workos/session";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function OverviewPage() {
	const session = await getAppSession();
	const auditRange = overviewAuditRange();

	if (session?.organizationId) {
		await prefetchGraphqlQueries([
			{ document: OVERVIEW_QUERY, variables: overviewVariables() },
			{ document: ORGANIZATION_QUERY, variables: { id: session.organizationId } },
			{
				document: AUDIT_EVENTS_QUERY,
				variables: overviewAuditEventsVariables(auditRange),
			},
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
