"use client";
import { Dialog } from "radix-ui";
import { useMobileNavigation } from "./mobile-navigation-context";
import { Cross2Icon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { NAV_SECTIONS } from "./nav";
import { OrganizationSwitcher } from "./organization-switcher";
import { usePathname } from "next/navigation";

export function MobileNavigationTrigger(props: React.ComponentPropsWithoutRef<"button">) {
	const { setOpen, triggerRef, shouldShowMobileNavigation } = useMobileNavigation();
	return (
		<button
			{...props}
			type="button"
			onClick={(event) => {
				props.onClick?.(event);
				if (event.defaultPrevented || !shouldShowMobileNavigation) {
					return;
				}
				setOpen(true);
			}}
			ref={triggerRef}
		>
			<span className="sr-only">Open navigation</span>
			<HamburgerMenuIcon aria-hidden height={15} width={15} />
		</button>
	);
}

export function Sidebar({ mode }: { mode: "live" | "demo" }) {
	const { shouldShowMobileNavigation, open, setOpen, triggerRef } = useMobileNavigation();
	const pathname = usePathname();
	const sidebar = (
		<SidebarImpl
			mode={mode}
			pathname={pathname}
			open={shouldShowMobileNavigation ? open : true}
			onClose={() => setOpen(false)}
		/>
	);

	return shouldShowMobileNavigation ? (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Portal>
				<Dialog.Overlay className="AppShellNavScrim" />
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
	);
}

function SidebarImpl({
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
		<div {...props} className="AppShellSidebar" data-open={open || undefined}>
			<div className="AppShellSidebarHeader">
				<span className="AppShellLogo" aria-hidden>
					S
				</span>
				<div className="AppShellIdentity">
					<p className="AppShellAppName truncate">SuperApp</p>
					<p className="AppShellOrganization truncate">
						<OrganizationSwitcher />
					</p>
				</div>
				<button
					type="button"
					aria-label="Close navigation"
					className="AppShellNavClose"
					onClick={() => onClose()}
				>
					<Cross2Icon aria-hidden height={15} width={15} />
				</button>
			</div>
			<nav aria-labelledby="main-navigation-heading" className="AppShellNav scrollbar-slim">
				<h2 id="main-navigation-heading" className="sr-only">
					Main navigation
				</h2>
				{NAV_SECTIONS.map((section) => (
					<div key={section.label}>
						<h3 className="AppShellSectionLabel">{section.label}</h3>
						<ul className="AppShellSectionItems">
							{section.items.map((item) => {
								const isActive = pathname === item.href;
								return (
									<li key={item.href}>
										<Link
											href={item.href}
											className="AppShellNavLink"
											data-active={isActive || undefined}
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

			<div className="AppShellSidebarFooter">
				<div className="AppShellModeCard">
					<div className="AppShellModeHeader">
						<p className="AppShellModeTitle">WorkOS Widgets API</p>
						<Badge tone={mode === "live" ? "positive" : "caution"}>
							{mode === "live" ? "Live" : "Demo"}
						</Badge>
					</div>
					<p className="AppShellModeDescription">
						{mode === "live"
							? "Reading and writing real data through POST /client/graphql."
							: "Running against an in-memory copy of the schema. Add WorkOS credentials to go live."}
					</p>
				</div>
			</div>
		</div>
	);
}
