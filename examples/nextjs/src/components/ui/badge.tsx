import * as React from "react";
import clsx from "clsx";

export type BadgeTone = "neutral" | "accent" | "positive" | "caution" | "critical";

export function Badge({
	tone = "neutral",
	children,
	className,
	...props
}: {
	tone?: BadgeTone;
	children: React.ReactNode;
	className?: string;
	"aria-hidden"?: boolean;
	ref?: React.Ref<HTMLSpanElement>;
}) {
	return (
		<span
			className={clsx("ui-Badge", className)}
			{...props}
			data-ui-component="badge"
			data-ui-badge-tone={tone}
		>
			{children}
		</span>
	);
}

export function BadgeDot({
	tone = "neutral",
	className,
	...props
}: {
	tone?: BadgeTone;
	className?: string;
	ref?: React.Ref<HTMLSpanElement>;
}) {
	return (
		<span
			aria-hidden
			className={clsx("ui-BadgeDot", className)}
			{...props}
			data-ui-component="badge-dot"
			data-ui-badge-dot-tone={tone}
		/>
	);
}
