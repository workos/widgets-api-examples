"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { GraphqlClientContext } from "@/lib/graphql/hooks";
import { createGraphqlClient } from "@/lib/graphql/request";

/**
 * Provides TanStack Query + the thin Client API fetch helper.
 *
 * Step 2 of the Widgets API quick start: the session token from `POST /client/token`
 * (or a demo stand-in) is attached to every GraphQL request.
 */
export function WidgetsApiProvider({
	children,
	initialToken,
	mode,
}: {
	children: React.ReactNode;
	initialToken: string | null;
	mode: "live" | "demo";
}) {
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						refetchOnWindowFocus: false,
						retry: 1,
					},
				},
			}),
	);

	const [graphqlClient] = React.useState(() => createGraphqlClient({ mode, initialToken }));

	return (
		<QueryClientProvider client={queryClient}>
			<GraphqlClientContext value={graphqlClient}>{children}</GraphqlClientContext>
		</QueryClientProvider>
	);
}
