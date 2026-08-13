"use client";

import * as React from "react";
import * as DialogToggleEventsPolyfill from "dialog-toggle-events-polyfill/fn";

export function Polyfills() {
	React.useInsertionEffect(() => {
		if (!DialogToggleEventsPolyfill.isSupported() && !DialogToggleEventsPolyfill.isPolyfilled()) {
			DialogToggleEventsPolyfill.apply();
		}
	}, []);
	return null;
}
