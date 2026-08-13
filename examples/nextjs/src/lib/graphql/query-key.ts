import { getOperationName } from "@/lib/graphql/gql";

/** Must match the key used by `useGraphqlQuery` so dehydrated data hydrates into the right cache entry. */
export function graphqlQueryKey(
	document: string,
	variables?: Record<string, unknown> | null,
): readonly [string, Record<string, unknown>] {
	return [getOperationName(document), variables ?? {}];
}

/**
 * Prefix that matches every cached entry for an operation, regardless of variables.
 * Use with `queryClient.invalidateQueries` after mutations.
 */
export function graphqlQueryKeyPrefix(document: string): readonly [string] {
	return [getOperationName(document)];
}
