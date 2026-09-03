"use client";

import * as React from "react";
import { useBreakpoint } from "./breakpoints-context";
import { Breakpoint } from "@/lib/breakpoints";
import { usePathname } from "next/navigation";

type MobileNavigationContextValue = {
	shouldShowMobileNavigation: boolean;
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const MobileNavigationContext = React.createContext<MobileNavigationContextValue | null>(null);
MobileNavigationContext.displayName = "MobileNavigationContext";

export function useMobileNavigation(): MobileNavigationContextValue {
	const context = React.use(MobileNavigationContext);
	if (!context) {
		throw new Error("useMobileNavigation must be used within a MobileNavigationProvider");
	}
	return context;
}

export function MobileNavigationProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = React.useState(false);
	const shouldShowMobileNavigation = useBreakpoint(Breakpoint.LgDown);

	const pathname = usePathname();
	const triggerRef = React.useRef<HTMLButtonElement | null>(null);

	// Close the navigation menu when the user navigates to a new page
	const previousPathnameRef = React.useRef(pathname);
	React.useEffect(() => {
		const previousPathname = previousPathnameRef.current;
		previousPathnameRef.current = pathname;
		if (previousPathname !== pathname) {
			setOpen(false);
		}
	}, [pathname]);

	return (
		<MobileNavigationContext
			value={{
				shouldShowMobileNavigation,
				open,
				setOpen,
				triggerRef,
			}}
		>
			{children}
		</MobileNavigationContext>
	);
}
