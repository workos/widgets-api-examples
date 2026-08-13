import { handleAuth } from "@workos-inc/authkit-nextjs";

/** Matches `NEXT_PUBLIC_WORKOS_REDIRECT_URI` and the redirect configured in WorkOS. */
export const GET = handleAuth({ returnPathname: "/" });
