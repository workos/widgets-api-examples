"use server";

import { isLiveMode } from "@/lib/config";

/** Ends the AuthKit session. No-op in demo mode, which has no real session. */
export async function signOutAction(): Promise<void> {
	if (!isLiveMode()) return;

	const { signOut } = await import("@workos-inc/authkit-nextjs");
	await signOut({ returnTo: "/" });
}
