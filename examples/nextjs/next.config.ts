import type { NextConfig } from "next";

const liveEnvVars = [
	"WORKOS_API_KEY",
	"WORKOS_CLIENT_ID",
	"WORKOS_COOKIE_PASSWORD",
	"NEXT_PUBLIC_WORKOS_REDIRECT_URI",
];

const nextConfig: NextConfig = {
	reactCompiler: true,
	typedRoutes: true,
	env: {
		NEXT_PUBLIC_APP_MODE:
			process.env.WIDGETS_DEMO_MODE !== "1" && liveEnvVars.every((name) => process.env[name])
				? "live"
				: "demo",
	},
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "workoscdn.com" },
			{ protocol: "https", hostname: "avatars.githubusercontent.com" },
			{ protocol: "https", hostname: "lh3.googleusercontent.com" },
			{ protocol: "https", hostname: "i.pravatar.cc" },
		],
	},
};

export default nextConfig;
