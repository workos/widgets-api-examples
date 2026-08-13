import { ProfileWidget } from "@/components/widgets/profile";
import { HydrationBoundary } from "@tanstack/react-query";
import { ME_QUERY } from "@/lib/graphql/operations";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function ProfilePage() {
	await prefetchGraphqlQueries([{ document: ME_QUERY }]);

	const navItem = findNavItem("/profile");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<ProfileWidget />
		</HydrationBoundary>
	);
}
