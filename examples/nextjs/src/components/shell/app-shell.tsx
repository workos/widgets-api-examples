"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { findNavItem, NAV_SECTIONS } from "@/components/shell/nav";
import { OrganizationLabel } from "@/components/shell/organization-label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Cross2Icon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { displayName } from "@/lib/format";
import type { AppUser } from "@/lib/workos/session";
import { signOutAction } from "@/lib/workos/auth-actions";
import { Dialog, DropdownMenu } from "radix-ui";
import { useMatchMedia } from "@/lib/use-match-media";
import { media } from "@/lib/breakpoints";

import styles from "./app-shell.module.css";

export function AppShell({
	user,
	mode,
	children,
}: {
	user: AppUser;
	mode: "live" | "demo";
	children: React.ReactNode;
}) {
	const [navOpen, setNavOpen] = React.useState(false);
	const pathname = usePathname();
	const active = findNavItem(pathname);
	const triggerRef = React.useRef<HTMLButtonElement | null>(null);

	// Close the navigation menu when the user navigates to a new page
	const previousPathnameRef = React.useRef(pathname);
	React.useEffect(() => {
		const previousPathname = previousPathnameRef.current;
		previousPathnameRef.current = pathname;
		if (previousPathname !== pathname) {
			setNavOpen(false);
		}
	}, [pathname]);

	// Navigation should only be visible on smaller devices. This matches the
	// `@media (--lg)` rules that hide the mobile affordances.
	const shouldShowMobileNavigation = useMatchMedia(media.lgDown);

	const sidebar = (
		<Sidebar
			mode={mode}
			pathname={pathname}
			open={shouldShowMobileNavigation ? navOpen : true}
			onClose={() => setNavOpen(false)}
		/>
	);

	return (
		<div className={styles.shell}>
			{shouldShowMobileNavigation ? (
				<Dialog.Root open={navOpen} onOpenChange={setNavOpen}>
					<Dialog.Portal>
						<Dialog.Overlay className={styles.navScrim} />
						<Dialog.Content
							onCloseAutoFocus={(event) => {
								event.preventDefault();
								triggerRef.current?.focus();
							}}
							asChild
						>
							{sidebar}
						</Dialog.Content>
					</Dialog.Portal>
				</Dialog.Root>
			) : (
				sidebar
			)}
			<div className={styles.column}>
				<header className={styles.header}>
					<button
						type="button"
						onClick={() => setNavOpen(true)}
						aria-label="Open navigation"
						className={styles.navToggle}
						ref={triggerRef}
					>
						<HamburgerMenuIcon aria-hidden height={15} width={15} />
					</button>
					<h1 className={styles.pageTitle}>{active?.label ?? "Dashboard"}</h1>
					<UserMenu user={user} />
				</header>
				<main className={styles.main}>{children}</main>
			</div>
		</div>
	);
}

function Sidebar({
	mode,
	pathname,
	open,
	onClose,
	...props
}: {
	mode: "live" | "demo";
	pathname: string;
	open: boolean;
	onClose: () => void;
}) {
	return (
		<div {...props} className={clsx(styles.sidebar, open && styles.sidebarOpen)}>
			<div className={styles.sidebarHeader}>
				<span className={styles.logo} aria-hidden>
					S
				</span>
				<div className={styles.identity}>
					<p className={styles.appName}>SuperApp</p>
					<p className={styles.organization}>
						<OrganizationLabel />
					</p>
				</div>
				<button
					type="button"
					aria-label="Close navigation"
					className={styles.navClose}
					onClick={() => onClose()}
				>
					<Cross2Icon aria-hidden height={15} width={15} />
				</button>
			</div>
			<nav aria-labelledby="main-navigation-heading" className={styles.nav}>
				<h2 id="main-navigation-heading" className={styles.navHeading}>
					Main navigation
				</h2>
				{NAV_SECTIONS.map((section) => (
					<div key={section.label}>
						<h3 className={styles.sectionLabel}>{section.label}</h3>
						<ul className={styles.sectionItems}>
							{section.items.map((item) => {
								const isActive = pathname === item.href;
								return (
									<li key={item.href}>
										<Link
											href={item.href}
											className={clsx(styles.navLink, isActive && styles.navLinkActive)}
										>
											{item.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</nav>

			<div className={styles.sidebarFooter}>
				<div className={styles.modeCard}>
					<div className={styles.modeHeader}>
						<p className={styles.modeTitle}>WorkOS Widgets API</p>
						<Badge tone={mode === "live" ? "positive" : "caution"}>
							{mode === "live" ? "Live" : "Demo"}
						</Badge>
					</div>
					<p className={styles.modeDescription}>
						{mode === "live"
							? "Reading and writing real data through POST /client/graphql."
							: "Running against an in-memory copy of the schema. Add WorkOS credentials to go live."}
					</p>
				</div>
			</div>
		</div>
	);
}

function UserMenu({ user }: { user: AppUser }) {
	const [open, setOpen] = React.useState(false);
	const [pending, startTransition] = React.useTransition();

	return (
		<div className={styles.userMenu}>
			<DropdownMenu.Root open={open} onOpenChange={setOpen}>
				<DropdownMenu.Trigger className={styles.userMenuTrigger} aria-label="Account menu">
					<Avatar
						size="sm"
						email={user.email}
						firstName={user.firstName}
						lastName={user.lastName}
						src={user.profilePictureUrl}
					/>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content className={styles.userMenuContent} sideOffset={5}>
					<div className={styles.userMenuHeader}>
						<p className={styles.userMenuName}>{displayName(user)}</p>
						<p className={styles.userMenuEmail}>{user.email}</p>
					</div>
					<DropdownMenu.Item
						disabled={pending}
						onSelect={() => startTransition(() => signOutAction())}
						className={styles.userMenuItem}
					>
						{pending ? "Signing out…" : "Sign out"}
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	);
}
