/**
 * Breakpoint media queries, mirroring the `@custom-media` definitions in
 * `src/styles/media.css`. CSS custom media queries can't be read from
 * JavaScript, so anything that needs a breakpoint at runtime reads it here.
 */
export const media = {
	sm: "(min-width: 40rem)",
	md: "(min-width: 48rem)",
	lg: "(min-width: 64rem)",
	xl: "(min-width: 80rem)",
	smDown: "(max-width: 39.999rem)",
	mdDown: "(max-width: 47.999rem)",
	lgDown: "(max-width: 63.999rem)",
	xlDown: "(max-width: 79.999rem)",
} as const;
