"use server";

import { isLiveMode, WORKOS_CLIENT_TOKEN_URL } from "@/lib/config";
import { getAppSession } from "@/lib/workos/session";

export type ClientTokenResult =
	| { ok: true; token: string }
	| {
			ok: false;
			reason: "unauthenticated" | "no-organization" | "request-failed";
			message: string;
	  };

/**
 * Exchanges the AuthKit session for a Client API session token.
 *
 * This is the server-side half of the Widgets API. The WorkOS API key never
 * leaves the server, and the browser only ever receives the short-lived token
 * scoped to this user and organization.
 *
 * Exposed as a Server Action so the browser can transparently mint a fresh
 * token when the current one expires mid-session.
 */
export async function issueClientApiToken(): Promise<ClientTokenResult> {
	const session = await getAppSession();

	if (!session) {
		return {
			ok: false,
			reason: "unauthenticated",
			message: "You are not signed in.",
		};
	}

	if (!isLiveMode()) {
		return { ok: true, token: "demo-session-token" };
	}

	if (!session.organizationId) {
		return {
			ok: false,
			reason: "no-organization",
			message:
				"Your AuthKit session is not scoped to an organization. Add your user to an organization in the WorkOS dashboard, then sign in again.",
		};
	}

	const response = await fetch(WORKOS_CLIENT_TOKEN_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.WORKOS_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			organization_id: session.organizationId,
			user_id: session.user.id,
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		const detail = await response.text();
		return {
			ok: false,
			reason: "request-failed",
			message: `POST /client/token failed with ${response.status}. ${detail.slice(0, 300)}`,
		};
	}

	const { token } = (await response.json()) as { token?: string };

	if (!token) {
		return {
			ok: false,
			reason: "request-failed",
			message: "POST /client/token succeeded but returned no token.",
		};
	}

	return { ok: true, token };
}
