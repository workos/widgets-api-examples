"use client";

import * as React from "react";

interface SessionContextValue {
	userId: string;
	organizationId: string;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);
SessionContext.displayName = "SessionContext";

export function AppSessionProvider({
	value,
	children,
}: {
	value: SessionContextValue;
	children: React.ReactNode;
}) {
	return <SessionContext value={value}>{children}</SessionContext>;
}

export function useAppSession(): SessionContextValue {
	const context = React.use(SessionContext);
	if (!context) {
		throw new Error("useAppSession must be used inside <AppSessionProvider>");
	}
	return context;
}
