import "server-only";

import { isLiveMode } from "@/lib/config";
import { createDemoDatabase, DEMO_ORG_ID } from "@/lib/demo/data";

export interface AppUser {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
}

export interface AppSession {
	user: AppUser;
	organizationId: string | null;
	role: string | null;
	permissions: string[];
}

const DEMO_SESSION: AppSession = (() => {
	const demo = createDemoDatabase();
	return {
		user: {
			id: demo.me.id,
			email: demo.me.email,
			firstName: demo.me.firstName,
			lastName: demo.me.lastName,
			profilePictureUrl: demo.me.profilePictureUrl,
		},
		organizationId: DEMO_ORG_ID,
		role: "admin",
		permissions: demo.roles.find((role) => role.slug === "admin")?.permissions ?? [],
	};
})();

export async function getAppSession(): Promise<AppSession | null> {
	if (!isLiveMode()) {
		return DEMO_SESSION;
	}

	const { withAuth } = await import("@workos-inc/authkit-nextjs");
	const auth = await withAuth();

	if (!auth.user) {
		return null;
	}

	return {
		user: {
			id: auth.user.id,
			email: auth.user.email,
			firstName: auth.user.firstName ?? null,
			lastName: auth.user.lastName ?? null,
			profilePictureUrl: auth.user.profilePictureUrl ?? null,
		},
		organizationId: auth.organizationId ?? null,
		role: auth.role ?? null,
		permissions: auth.permissions ?? [],
	};
}
