import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { AppSessionProvider } from "@/components/shell/session-context";
import { SetupRequired } from "@/components/shell/setup-required";
import { getAppMode, isLiveMode } from "@/lib/config";
import { WidgetsApiProvider } from "@/lib/graphql/client";
import { HydrationBoundary } from "@tanstack/react-query";
import { ORGANIZATIONS_QUERY } from "@/lib/graphql/operations";
import {
	dehydrateQueryClient,
	getClientTokenResult,
	prefetchGraphqlQueries,
} from "@/lib/graphql/server";
import { getAppSession } from "@/lib/workos/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	const session = await getAppSession();

	if (!session) {
		// Live mode only; AuthKit is configured but nobody is signed in yet
		const { getSignInUrl } = await import("@workos-inc/authkit-nextjs");
		return redirect<any>(await getSignInUrl());
	}

	// Step 1: mint a Client API token for this user + organization
	const token = await getClientTokenResult();

	if (!token.ok) {
		return <SetupRequired reason={token.reason} message={token.message} />;
	}

	// Warm the sidebar org label; pages nest their own dehydrated caches below
	await prefetchGraphqlQueries([{ document: ORGANIZATIONS_QUERY }]);

	return (
		// Step 2: hand the token to the GraphQL client
		<WidgetsApiProvider initialToken={token.token} mode={getAppMode()}>
			<HydrationBoundary state={dehydrateQueryClient()}>
				<AppSessionProvider
					value={{
						userId: session.user.id,
						organizationId: session.organizationId!,
					}}
				>
					<AppShell user={session.user} mode={isLiveMode() ? "live" : "demo"}>
						{children}
					</AppShell>
				</AppSessionProvider>
			</HydrationBoundary>
		</WidgetsApiProvider>
	);
}
