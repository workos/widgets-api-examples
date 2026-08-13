import { DEMO_GRAPHQL_PATH, WORKOS_GRAPHQL_URL } from "@/lib/config";
import { getOperationKind, getOperationName } from "@/lib/graphql/gql";
import { recordOperation } from "@/lib/graphql/operation-log";
import { issueClientApiToken } from "@/lib/workos/client-token";

export class GraphqlRequestError extends Error {
	readonly errors: { message: string; extensions?: Record<string, unknown> }[];
	readonly statusCode?: number;

	constructor(
		message: string,
		options?: {
			errors?: { message: string; extensions?: Record<string, unknown> }[];
			statusCode?: number;
		},
	) {
		super(message);
		this.name = "GraphqlRequestError";
		this.errors = options?.errors ?? [];
		this.statusCode = options?.statusCode;
	}
}

type TokenStore = {
	get: () => Promise<string | null>;
	invalidate: () => void;
};

function createTokenStore(initialToken: string | null): TokenStore {
	let cached: Promise<string | null> | null = initialToken ? Promise.resolve(initialToken) : null;

	return {
		get() {
			cached ??= issueClientApiToken().then((result) => (result.ok ? result.token : null));
			return cached;
		},
		invalidate() {
			cached = null;
		},
	};
}

function isAuthFailure(statusCode: number | undefined, error: GraphqlRequestError) {
	if (statusCode === 401) return true;
	return error.errors.some((graphQLError) => {
		const code = graphQLError.extensions?.code;
		return (
			code === "UNAUTHENTICATED" ||
			/unauthorized|unauthenticated|token (is )?(invalid|expired)/i.test(graphQLError.message)
		);
	});
}

export type GraphqlClient = {
	request: <TData>(document: string, variables?: Record<string, unknown>) => Promise<TData>;
};

export function createGraphqlClient(options: {
	mode: "live" | "demo";
	initialToken: string | null;
}): GraphqlClient {
	const uri = options.mode === "live" ? WORKOS_GRAPHQL_URL : DEMO_GRAPHQL_PATH;
	const tokens = createTokenStore(options.initialToken);

	async function execute<TData>(
		document: string,
		variables: Record<string, unknown> | undefined,
		retried: boolean,
	): Promise<TData> {
		const startedAt = Date.now();
		const name = getOperationName(document);
		const kind = getOperationKind(document);
		const token = await tokens.get();

		let statusCode: number | undefined;
		try {
			const response = await fetch(uri, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ query: document, variables }),
			});

			statusCode = response.status;
			const payload = (await response.json()) as {
				data?: TData;
				errors?: { message: string; extensions?: Record<string, unknown> }[];
			};

			if (!response.ok || payload.errors?.length) {
				const error = new GraphqlRequestError(
					payload.errors?.[0]?.message ?? `GraphQL request failed with ${response.status}`,
					{ errors: payload.errors, statusCode: response.status },
				);

				if (!retried && isAuthFailure(statusCode, error)) {
					tokens.invalidate();
					return execute(document, variables, true);
				}

				recordOperation({
					name,
					kind,
					query: document,
					variables: variables ?? {},
					startedAt,
					durationMs: Date.now() - startedAt,
					status: "error",
					errors: payload.errors?.map((item) => item.message) ?? [error.message],
					result: payload.data,
				});
				throw error;
			}

			recordOperation({
				name,
				kind,
				query: document,
				variables: variables ?? {},
				startedAt,
				durationMs: Date.now() - startedAt,
				status: "ok",
				result: payload.data,
			});

			return payload.data as TData;
		} catch (error) {
			if (error instanceof GraphqlRequestError) throw error;

			const message = error instanceof Error ? error.message : "Network error";
			recordOperation({
				name,
				kind,
				query: document,
				variables: variables ?? {},
				startedAt,
				durationMs: Date.now() - startedAt,
				status: "error",
				errors: [message],
			});
			throw new GraphqlRequestError(message, { statusCode });
		}
	}

	return {
		request<TData>(document: string, variables?: Record<string, unknown>) {
			return execute<TData>(document, variables, false);
		},
	};
}
