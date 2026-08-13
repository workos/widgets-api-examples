import { DirectoriesWidget } from "@/components/widgets/directories";
import { HydrationBoundary } from "@tanstack/react-query";
import { DIRECTORY_CONNECTIONS_QUERY } from "@/lib/graphql/operations";
import { directoryPageVariables } from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";

export default async function DirectoryPage() {
	await prefetchGraphqlQueries([
		{ document: DIRECTORY_CONNECTIONS_QUERY, variables: directoryPageVariables() },
	]);

	const navItem = findNavItem("/directory");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection title={navItem.label} description={navItem.description} />
			<DirectoriesWidget />
		</HydrationBoundary>
	);
}
