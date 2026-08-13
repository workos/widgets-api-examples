import { SsoWidget } from "@/components/widgets/sso";
import { HydrationBoundary } from "@tanstack/react-query";
import { SSO_CONNECTIONS_QUERY } from "@/lib/graphql/operations";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function SsoPage() {
	await prefetchGraphqlQueries([{ document: SSO_CONNECTIONS_QUERY }]);

	const navItem = findNavItem("/sso");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<SsoWidget />
		</HydrationBoundary>
	);
}
