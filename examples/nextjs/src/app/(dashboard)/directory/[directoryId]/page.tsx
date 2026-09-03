import { HydrationBoundary } from "@tanstack/react-query";
import {
	DIRECTORY_CONNECTION_QUERY,
	DIRECTORY_GROUPS_QUERY,
	DIRECTORY_USERS_QUERY,
} from "@/lib/graphql/operations";
import { directoryGroupsVariables, directoryUsersVariables } from "@/lib/graphql/page-queries";
import { dehydrateQueryClient, prefetchGraphqlQueries } from "@/lib/graphql/server";
import { DirectoryDetailsWidget } from "@/components/widgets/directory-details";
import { findNavItem } from "@/components/shell/nav";
import { PageTitleSection } from "@/components/ui/page-title-section";
import Link from "next/link";

export default async function DirectoryPage(pageProps: PageProps<"/directory/[directoryId]">) {
	const { directoryId } = await pageProps.params;
	await prefetchGraphqlQueries([
		{ document: DIRECTORY_CONNECTION_QUERY, variables: { id: directoryId } },
		{ document: DIRECTORY_USERS_QUERY, variables: directoryUsersVariables(directoryId) },
		{ document: DIRECTORY_GROUPS_QUERY, variables: directoryGroupsVariables(directoryId) },
	]);

	const navItem = findNavItem("/directory");
	return (
		<HydrationBoundary state={dehydrateQueryClient()}>
			<PageTitleSection
				title={navItem.label}
				description={
					<>
						Browse directory connections and the users and groups they provision.{" "}
						<Link href="/directory">
							<span className="DirectoryPageBackLink">View all directories</span>
						</Link>
					</>
				}
			/>
			<DirectoryDetailsWidget directoryId={directoryId} />
		</HydrationBoundary>
	);
}
