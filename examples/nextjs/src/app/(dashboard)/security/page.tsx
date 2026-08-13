import { SecurityWidget } from "@/components/widgets/security";
import { HydrationBoundary } from "@tanstack/react-query";
import { ME_QUERY, PASSKEYS_QUERY, SESSIONS_QUERY } from "@/lib/graphql/operations";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function SecurityPage() {
	await prefetchGraphqlQueries([
		{ document: SESSIONS_QUERY },
		{ document: PASSKEYS_QUERY },
		{ document: ME_QUERY },
	]);

	const navItem = findNavItem("/security");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<SecurityWidget />
		</HydrationBoundary>
	);
}
