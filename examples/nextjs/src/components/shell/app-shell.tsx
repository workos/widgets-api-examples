import type * as React from "react";
import type { AppUser } from "@/lib/workos/session";
import { MobileNavigationTrigger, Sidebar } from "./navigation";
import { MobileNavigationProvider } from "./mobile-navigation-context";
import { PageTitle } from "./page-title";
import {
	UserMenuDropdown,
	UserMenuDropdownContent,
	UserMenuDropdownItem,
	UserMenuDropdownTrigger,
	UserMenuEmail,
	UserMenuName,
} from "./user-menu";

export function AppShell({
	user,
	mode,
	children,
}: {
	user: AppUser;
	mode: "live" | "demo";
	children: React.ReactNode;
}) {
	return (
		<div className="AppShell">
			<MobileNavigationProvider>
				<Sidebar mode={mode} />
				<div className="AppShellColumn">
					<header className="AppShellHeader">
						<MobileNavigationTrigger className="AppShellNavToggle" />
						<PageTitle className="AppShellPageTitle" />
						<div className="AppShellUserMenu">
							<UserMenuDropdown user={user}>
								<UserMenuDropdownTrigger
									className="AppShellUserMenuTrigger"
									aria-label="Account menu"
								/>
								<UserMenuDropdownContent className="AppShellUserMenuContent">
									<div className="AppShellUserMenuHeader">
										<UserMenuName className="AppShellUserMenuName truncate" />
										<UserMenuEmail className="AppShellUserMenuEmail truncate" />
									</div>
									<UserMenuDropdownItem className="AppShellUserMenuItem" />
								</UserMenuDropdownContent>
							</UserMenuDropdown>
						</div>
					</header>
					<main className="AppShellMain">{children}</main>
				</div>
			</MobileNavigationProvider>
		</div>
	);
}
