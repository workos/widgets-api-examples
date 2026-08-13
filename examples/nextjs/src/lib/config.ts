/**
 * The example runs in one of two modes:
 *
 *  - `live`: talks to the real WorkOS Client API. Requires WorkOS credentials and
 *    an environment with the Widgets API closed beta enabled.
 *  - `demo`: serves the same GraphQL schema from an in-memory resolver inside this
 *    app, so the dashboard is fully explorable without any credentials.
 *
 * Mode is inferred from the environment rather than configured, so cloning the
 * repo and running `pnpm dev` always produces a working app.
 */
export type AppMode = "live" | "demo";

const LIVE_ENV_VARS = [
	"WORKOS_API_KEY",
	"WORKOS_CLIENT_ID",
	"WORKOS_COOKIE_PASSWORD",
	"NEXT_PUBLIC_WORKOS_REDIRECT_URI",
] as const;

export const DEMO_GRAPHQL_PATH = "/api/demo/graphql";

export const WORKOS_GRAPHQL_URL =
	process.env.NEXT_PUBLIC_WORKOS_GRAPHQL_URL ?? "https://api.workos.com/client/graphql";

export const WORKOS_CLIENT_TOKEN_URL =
	process.env.WORKOS_CLIENT_TOKEN_URL ?? "https://api.workos.com/client/token";

/**
 * Client components cannot read server-only env vars, so live mode is mirrored
 * into a public variable that `next.config.ts` derives at build time.
 */
export function getAppMode(): AppMode {
	if (typeof window !== "undefined") {
		return process.env.NEXT_PUBLIC_APP_MODE === "live" ? "live" : "demo";
	}
	if (process.env.WIDGETS_DEMO_MODE === "1") {
		return "demo";
	}
	return LIVE_ENV_VARS.every((name) => Boolean(process.env[name])) ? "live" : "demo";
}

export function isLiveMode(): boolean {
	return getAppMode() === "live";
}

export function missingLiveEnvVars(): string[] {
	return LIVE_ENV_VARS.filter((name) => !process.env[name]);
}
