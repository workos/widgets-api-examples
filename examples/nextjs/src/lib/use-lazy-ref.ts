import * as React from "react";

const UNSET = Symbol("useLazyRef.unset");

export function useLazyRef<T>(factory: () => T): React.MutableRefObject<T> {
	const ref = React.useRef<T>(UNSET as any);
	// oxlint-disable-next-line react/react-compiler
	if (ref.current === UNSET) {
		// oxlint-disable-next-line react/react-compiler
		ref.current = factory();
	}
	return ref;
}
