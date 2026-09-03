"use server";

import { getAppOrigin, isLiveMode } from "@/lib/config";

/**
 * Ends the AuthKit session. No-op in demo mode, which has no real session.
 *
 * `returnTo` overrides the Sign-out URI configured in the WorkOS dashboard and
 * must be absolute, so it is built from this deployment's own origin rather than
 * the relative path WorkOS would reject.
 */
export async function signOutAction(): Promise<void> {
	if (!isLiveMode()) {
		return;
	}

	const origin = getAppOrigin();
	const { signOut } = await import("@workos-inc/authkit-nextjs");
	await signOut(origin ? { returnTo: `${origin}/` } : undefined);
}

/**
 * Re-scopes the session to another organization the user belongs to, then
 * revalidates `returnTo` so the layout mints a Client API token for it.
 *
 * `returnTo` is passed explicitly because the SDK otherwise falls back to the
 * proxy's `x-url` header, which holds an absolute URL rather than the path that
 * `revalidatePath` expects.
 */
export async function switchOrganizationAction(
	organizationId: string,
	returnTo: string,
): Promise<void> {
	if (!isLiveMode()) {
		return;
	}

	// Server actions accept whatever the client sends, so keep the redirect target
	// on this origin instead of forwarding it to WorkOS verbatim.
	const isRelativePath = returnTo.startsWith("/") && !returnTo.startsWith("//");

	const { switchToOrganization } = await import("@workos-inc/authkit-nextjs");
	await switchToOrganization(organizationId, {
		returnTo: isRelativePath ? returnTo : "/",
	});
}
