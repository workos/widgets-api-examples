import type * as React from "react";
import type Link from "next/link";

type LinkProps = React.ComponentProps<typeof Link>;
type RoutePath = LinkProps["href"] & string;

export const NAV_SECTIONS = [
	{
		label: "Workspace",
		items: [
			{
				href: "/",
				label: "Overview",
				description: "A snapshot of the organization the Client API token is scoped to.",
			},
			{
				href: "/members",
				label: "Members",
				description: "List, search, invite, re-role, and remove members of this organization.",
			},
			{
				href: "/roles",
				label: "Roles & permissions",
				description: "Manage organization-scoped roles and inspect effective permissions.",
			},
		],
	},
	{
		label: "Authentication",
		items: [
			{
				href: "/sso",
				label: "Single sign-on",
				description: "Create and manage the organization's SAML and OIDC connections.",
			},
			{
				href: "/directory",
				label: "Directory Sync",
				description: "Browse directory connections and the users and groups they provision.",
			},
		],
	},
	{
		label: "Compliance",
		items: [
			{
				href: "/audit-logs",
				label: "Audit logs",
				description: "Query the organization's audit events and start an export.",
			},
		],
	},
	{
		label: "Your account",
		items: [
			{
				href: "/profile",
				label: "Profile",
				description: "Read and update the authenticated user's own profile.",
			},
			{
				href: "/security",
				label: "Security",
				description: "Password, authenticator app, email address, passkeys, and active sessions.",
			},
		],
	},
] as const satisfies GenericNavSection[];

type NavPath = (typeof NAV_SECTIONS)[number]["items"][number]["href"];

interface GenericNavItem {
	href: RoutePath;
	label: string;
	description: string;
}

interface GenericNavSection {
	label: string;
	items: GenericNavItem[];
}

export interface NavItem {
	href: NavPath;
	label: string;
	description: string;
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items as any);

export function findNavItem(pathname: NavPath): NavItem;
export function findNavItem(pathname: string): NavItem | undefined;
export function findNavItem(pathname: string): NavItem | undefined {
	return NAV_ITEMS.find((item) => {
		if (item.href === pathname) {
			return true;
		}

		if (item.href.startsWith("/") && pathname.startsWith("/")) {
			return item.href.split("/").slice(1).join("/") === pathname.split("/").slice(1).join("/");
		}

		return false;
	});
}
