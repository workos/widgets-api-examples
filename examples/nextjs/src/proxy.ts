import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextProxy } from "next/server";
import { isLiveMode } from "@/lib/config";

/**
 * AuthKit session management. In Next.js 16 this file replaces `middleware.ts`.
 *
 * Demo mode has no WorkOS credentials, so AuthKit is skipped entirely instead of
 * letting every request fail on an unconfigured client.
 */
const passthrough: NextProxy = () => NextResponse.next();

export default isLiveMode() ? authkitProxy() : passthrough;

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|api/demo).*)"],
};
