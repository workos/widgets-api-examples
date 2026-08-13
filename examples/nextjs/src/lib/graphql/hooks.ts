"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOperationName } from "@/lib/graphql/gql";
import { graphqlQueryKey, graphqlQueryKeyPrefix } from "@/lib/graphql/query-key";
import type { GraphqlClient } from "@/lib/graphql/request";
import type { UnionResult } from "@/lib/graphql/types";
import { isSuccess } from "@/lib/graphql/union";

export const GraphqlClientContext = React.createContext<GraphqlClient | null>(null);
GraphqlClientContext.displayName = "GraphqlClientContext";

export function useGraphqlClient(): GraphqlClient {
	const client = React.use(GraphqlClientContext);
	if (!client) {
		throw new Error("useGraphqlClient must be used inside <WidgetsApiProvider>");
	}
	return client;
}

interface QueryOptions<TData> {
	variables?: Record<string, unknown> | null;
	enabled?: boolean;
	keepPreviousData?: boolean;
	/**
	 * Refetch every N milliseconds while the query is enabled. Pass a callback to
	 * derive the delay from the latest data and return `false` to stop, which is
	 * how a query that watches asynchronous server-side work ends its own polling.
	 */
	refetchInterval?: number | ((data: TData | undefined) => number | false);
}

export function useGraphqlQuery<TData>(document: string, options?: QueryOptions<TData>) {
	const client = useGraphqlClient();
	const variables = options?.variables ?? undefined;
	const refetchInterval = options?.refetchInterval;

	return useQuery({
		queryKey: graphqlQueryKey(document, variables),
		queryFn: () => client.request<TData>(document, variables ?? undefined),
		enabled: options?.enabled ?? true,
		placeholderData: options?.keepPreviousData ? keepPreviousData : undefined,
		refetchInterval:
			typeof refetchInterval === "function"
				? (query) => refetchInterval(query.state.data)
				: refetchInterval,
	});
}

/**
 * Warm a query into the shared cache (e.g. on hover/focus before opening a dialog).
 * Deduped by React Query when the entry is still fresh.
 */
export function usePrefetchGraphqlQuery() {
	const client = useGraphqlClient();
	const queryClient = useQueryClient();

	return React.useCallback(
		(document: string, variables?: Record<string, unknown> | null) => {
			void queryClient.prefetchQuery({
				queryKey: graphqlQueryKey(document, variables),
				queryFn: () => client.request(document, variables ?? undefined),
			});
		},
		[client, queryClient],
	);
}

interface LoadableQuery {
	isPending: boolean;
}

/**
 * Returns `true` once every query has settled. Initializes from the first
 * render so that dehydrated/prefetched data skips the page skeleton.
 */
export function usePageReady(...queries: LoadableQuery[]) {
	const settled = queries.every((query) => !query.isPending);
	const readyRef = React.useRef(settled);
	// Reading/writing refs is typically a no-no because a ref written during a
	// discarded render keeps its value, meaning it can be set by a render that
	// never commits. This can result in tearing. However for an idempotent,
	// single write like this there's no risk in practice, so we can safely ignore
	// the lint rule.
	// oxlint-disable react/react-compiler
	if (settled) {
		readyRef.current = true;
	}
	return readyRef.current;
	// oxlint-enable react/react-compiler
}

interface MutationOptions<TData> {
	onSuccess?: (data: TData) => void;
	onError?: (error: Error) => void;
	/**
	 * Query documents to mark stale after a successful mutation. Matches every
	 * cached entry for that operation, regardless of variables — so inviting a
	 * member refreshes the overview list as well as the members page.
	 *
	 * Union error members (e.g. `InviteeAlreadyMember`) skip invalidation.
	 */
	invalidate?: string[];
}

/**
 * Client API mutations that return a union put `__typename` on the payload.
 * Success members are listed in `isSuccess`; anything else is an expected
 * failure and should not bust related queries. Non-union payloads (roles, SSO)
 * have no `__typename` and always count as success.
 */
function mutationPayloadSucceeded(data: unknown): boolean {
	if (!data || typeof data !== "object") {
		return true;
	}
	const payload = Object.values(data)[0];
	if (payload && typeof payload === "object" && payload !== null && "__typename" in payload) {
		return isSuccess(payload as UnionResult);
	}
	return true;
}

export function useGraphqlMutation<TData>(document: string, options?: MutationOptions<TData>) {
	const client = useGraphqlClient();
	const queryClient = useQueryClient();
	return useMutation<TData, Error, Record<string, unknown> | undefined>({
		mutationKey: [getOperationName(document)],
		mutationFn: (variables) => client.request<TData>(document, variables),
		onSuccess: (data) => {
			if (mutationPayloadSucceeded(data)) {
				for (const query of options?.invalidate ?? []) {
					void queryClient.invalidateQueries({ queryKey: graphqlQueryKeyPrefix(query) });
				}
			}
			options?.onSuccess?.(data);
		},
		onError: options?.onError,
	});
}
