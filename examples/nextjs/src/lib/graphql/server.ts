import "server-only";

import { cache } from "react";
import { dehydrate, QueryClient } from "@tanstack/react-query";

import { getAppMode, WORKOS_GRAPHQL_URL } from "@/lib/config";
import { executeDemoOperation } from "@/lib/demo/resolvers";
import { GraphqlRequestError } from "@/lib/graphql/request";
import { graphqlQueryKey } from "@/lib/graphql/query-key";
import { issueClientApiToken } from "@/lib/workos/client-token";

/** One QueryClient per RSC request so prefetches don't leak across users. */
export const getServerQueryClient = cache(
	() =>
		new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 30_000,
				},
			},
		}),
);

/** Dedupes `POST /client/token` when layout and page prefetches share a request. */
export const getClientTokenResult = cache(() => issueClientApiToken());

export async function getRequestClientToken() {
	const result = await getClientTokenResult();
	if (!result.ok) {
		throw new Error(result.message);
	}
	return result.token;
}

/**
 * Server-side GraphQL execution for prefetching.
 * Demo mode calls the in-memory resolver directly (no HTTP hop / artificial latency).
 * Live mode posts to the WorkOS Client API with the request's session token.
 */
export async function serverGraphqlRequest<TData>(
	document: string,
	variables?: Record<string, unknown>,
): Promise<TData> {
	if (getAppMode() === "demo") {
		const result = await executeDemoOperation({ query: document, variables });
		if (result.errors?.length) {
			throw new GraphqlRequestError(result.errors[0]?.message ?? "GraphQL request failed", {
				errors: result.errors.map((error) => ({ message: error.message })),
			});
		}
		return result.data as TData;
	}

	const token = await getRequestClientToken();
	const response = await fetch(WORKOS_GRAPHQL_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: document, variables }),
		cache: "no-store",
	});

	const payload = (await response.json()) as {
		data?: TData;
		errors?: { message: string; extensions?: Record<string, unknown> }[];
	};

	if (!response.ok || payload.errors?.length) {
		throw new GraphqlRequestError(
			payload.errors?.[0]?.message ?? `GraphQL request failed with ${response.status}`,
			{ errors: payload.errors, statusCode: response.status },
		);
	}

	return payload.data as TData;
}

export type PrefetchQuery = {
	document: string;
	variables?: Record<string, unknown> | null;
};

/** Prefetch one or more GraphQL documents into the per-request QueryClient. */
export async function prefetchGraphqlQueries(queries: PrefetchQuery[]) {
	const queryClient = getServerQueryClient();
	await Promise.all(
		queries.map(({ document, variables }) =>
			queryClient.prefetchQuery({
				queryKey: graphqlQueryKey(document, variables),
				queryFn: () => serverGraphqlRequest(document, variables ?? undefined),
			}),
		),
	);
	return queryClient;
}

export function dehydrateQueryClient(queryClient: QueryClient = getServerQueryClient()) {
	// RSC props must be plain JSON; GraphQL results can carry null-prototype objects.
	return JSON.parse(JSON.stringify(dehydrate(queryClient))) as ReturnType<typeof dehydrate>;
}
