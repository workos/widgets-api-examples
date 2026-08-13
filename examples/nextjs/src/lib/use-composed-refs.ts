import * as React from "react";

export function useComposedRefs<T>(...refs: (React.Ref<T> | undefined | null)[]) {
	return React.useCallback((node: T | null) => {
		const cleanupFunctions = new Set<() => void>();
		for (const ref of refs) {
			if (!ref) {
				continue;
			}

			if (typeof ref === "function") {
				const cleanup = ref(node);
				if (cleanup) {
					cleanupFunctions.add(cleanup);
				}
			} else {
				// oxlint-disable-next-line react/react-compiler
				ref.current = node;
			}
		}
		if (cleanupFunctions.size > 0) {
			return () => {
				for (const cleanup of cleanupFunctions) {
					cleanup();
				}
			};
		}
		// oxlint-disable-next-line react/react-compiler react-hooks/exhaustive-deps
	}, refs);
}
