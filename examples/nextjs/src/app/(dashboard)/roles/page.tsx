import { RolesWidget } from "@/components/widgets/roles";
import { HydrationBoundary } from "@tanstack/react-query";
import {
	EFFECTIVE_PERMISSIONS_QUERY,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	PERMISSIONS_QUERY,
	ROLES_QUERY,
} from "@/lib/graphql/operations";
import { rolesEffectiveVariables, rolesMembersVariables } from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function RolesPage() {
	await prefetchGraphqlQueries([
		{ document: ROLES_QUERY },
		{ document: PERMISSIONS_QUERY },
		{ document: ORGANIZATION_MEMBERSHIPS_QUERY, variables: rolesMembersVariables() },
		{ document: EFFECTIVE_PERMISSIONS_QUERY, variables: rolesEffectiveVariables() },
	]);

	const navItem = findNavItem("/roles");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<RolesWidget />
		</HydrationBoundary>
	);
}
