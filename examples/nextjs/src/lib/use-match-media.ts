import * as React from "react";

export function useMatchMedia(query: string, initialValue: boolean = false) {
	const [matches, setMatches] = React.useState(initialValue);
	const hasInitialized = React.useRef(false);
	React.useEffect(() => {
		const media = window.matchMedia(query);
		if (!hasInitialized.current) {
			hasInitialized.current = true;
			setMatches(media.matches);
		}
		const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
		media.addEventListener("change", listener);
		return () => media.removeEventListener("change", listener);
	}, [query]);

	return matches;
}
