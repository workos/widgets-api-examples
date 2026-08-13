import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";
import { Polyfills } from "@/components/shell/polyfills";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
	variable: "--font-plex-mono",
	subsets: ["latin"],
	weight: ["400", "700"],
});

export const metadata: Metadata = {
	title: "SuperApp — WorkOS Widgets API example",
	description:
		"A SaaS dashboard built entirely on the WorkOS Widgets API (Client API) GraphQL endpoint.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${inter.variable} ${plexMono.variable}`} suppressHydrationWarning>
			<Polyfills />
			<body>{children}</body>
		</html>
	);
}
