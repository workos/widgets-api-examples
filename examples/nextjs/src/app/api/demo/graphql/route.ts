import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config";
import { executeDemoOperation } from "@/lib/demo/resolvers";

/**
 * Stands in for `https://api.workos.com/client/graphql` when the app runs without
 * WorkOS credentials. Same schema, same documents, in-memory data.
 */
export async function POST(request: Request) {
	if (isLiveMode()) {
		return NextResponse.json(
			{ errors: [{ message: "The demo endpoint is disabled in live mode." }] },
			{ status: 404 },
		);
	}

	let body: { query?: string; variables?: Record<string, unknown>; operationName?: string };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ errors: [{ message: "Request body must be valid JSON." }] },
			{ status: 400 },
		);
	}

	if (!body.query) {
		return NextResponse.json({ errors: [{ message: "A `query` is required." }] }, { status: 400 });
	}

	// A little latency keeps loading and optimistic states honest during demos.
	await new Promise((resolve) => setTimeout(resolve, 120));

	const result = await executeDemoOperation({
		query: body.query,
		variables: body.variables,
		operationName: body.operationName,
	});

	return NextResponse.json(result);
}
