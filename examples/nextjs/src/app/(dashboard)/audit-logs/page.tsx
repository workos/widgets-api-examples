import { AuditLogsWidget } from "@/components/widgets/audit-logs";
import { HydrationBoundary } from "@tanstack/react-query";
import { AUDIT_EVENTS_QUERY } from "@/lib/graphql/operations";
import { auditEventsVariables, defaultAuditRangeInputs } from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function AuditLogsPage() {
	const initialRange = defaultAuditRangeInputs();

	await prefetchGraphqlQueries([
		{
			document: AUDIT_EVENTS_QUERY,
			variables: auditEventsVariables(initialRange),
		},
	]);

	const navItem = findNavItem("/audit-logs");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<AuditLogsWidget initialRange={initialRange} />
		</HydrationBoundary>
	);
}
