import { MembersWidget } from "@/components/widgets/members";
import { HydrationBoundary } from "@tanstack/react-query";
import { ORGANIZATION_MEMBERSHIPS_QUERY, ROLES_QUERY } from "@/lib/graphql/operations";
import { membersPageVariables } from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { PageTitleSection } from "@/components/ui/page-title-section";
import { findNavItem } from "@/components/shell/nav";

export default async function MembersPage() {
	await prefetchGraphqlQueries([
		{ document: ORGANIZATION_MEMBERSHIPS_QUERY, variables: membersPageVariables() },
		{ document: ROLES_QUERY },
	]);

	const navItem = findNavItem("/members");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<MembersWidget />
		</HydrationBoundary>
	);
}
