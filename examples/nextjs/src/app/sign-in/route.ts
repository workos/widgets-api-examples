import { redirect } from "next/navigation";

import { isLiveMode } from "@/lib/config";

/**
 * The Sign-in URL configured in the WorkOS dashboard. WorkOS-initiated flows such
 * as impersonation start here so the SDK can complete its PKCE/CSRF checks.
 */
export async function GET() {
	if (!isLiveMode()) {
		redirect("/");
	}

	const { getSignInUrl } = await import("@workos-inc/authkit-nextjs");
	redirect<any>(await getSignInUrl());
}
