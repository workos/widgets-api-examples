"use client";

import * as React from "react";
import { media, type Breakpoint } from "@/lib/breakpoints";

type Breakpoints = { [key in Breakpoint]: boolean };

interface BreakpointsContextValue {
	breakpoints: Breakpoints;
}

const BreakpointsContext = React.createContext<BreakpointsContextValue | null>(null);
BreakpointsContext.displayName = "BreakpointsContext";

export function useBreakpoints(): Breakpoints {
	const context = React.use(BreakpointsContext);
	if (!context) {
		throw new Error("useBreakpoints must be used within a BreakpointsProvider");
	}
	return context.breakpoints;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
	const context = React.use(BreakpointsContext);
	if (!context) {
		throw new Error("useBreakpoint must be used within a BreakpointsProvider");
	}
	return context.breakpoints[breakpoint];
}

export function BreakpointsProvider({ children }: { children: React.ReactNode }) {
	const hasInitialized = React.useRef(false);
	const [breakpoints, setBreakpoints] = React.useState<Breakpoints>({
		md: false,
		lg: false,
		sm: false,
		xl: false,
		smDown: false,
		mdDown: false,
		lgDown: false,
		xlDown: false,
	});
	React.useEffect(() => {
		const abortController = new AbortController();
		const initialBreakpoints: Partial<Breakpoints> = {};
		for (const [breakpoint, mediaQuery] of Object.entries(media)) {
			const list = window.matchMedia(mediaQuery);
			initialBreakpoints[breakpoint as Breakpoint] = list.matches;
			list.addEventListener(
				"change",
				(event) => {
					setBreakpoints((prev) => ({ ...prev, [breakpoint as Breakpoint]: event.matches }));
				},
				{ signal: abortController.signal },
			);
		}
		if (!hasInitialized.current) {
			hasInitialized.current = true;
			setBreakpoints((prev) => ({ ...prev, ...initialBreakpoints }));
		}
		return () => {
			abortController.abort();
		};
	}, []);

	return <BreakpointsContext value={{ breakpoints }}>{children}</BreakpointsContext>;
}
