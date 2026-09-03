import * as React from "react";
import { Slot } from "radix-ui";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export function Button({
	variant = "secondary",
	size = "md",
	loading = false,
	asChild = false,
	className,
	children,
	disabled,
	type = "button",
	onClick,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
	size?: Size;
	loading?: boolean;
	/**
	 * Render the single child with the button's styling instead of a `<button>`,
	 * for things that must be a real element of their own — a download `<a>`, say.
	 * `loading` and `disabled` do not apply, since the child owns its behavior.
	 */
	asChild?: boolean;
	children?: React.ReactNode;
}) {
	const classes = clsx("ui-Button", className);

	if (asChild) {
		return (
			<Slot.Root
				{...props}
				onClick={onClick}
				className={classes}
				data-ui-component="button"
				data-ui-button-variant={variant}
				data-ui-button-size={size}
			>
				{children}
			</Slot.Root>
		);
	}

	const isDisabled = !!(disabled || loading);
	return (
		<button
			{...props}
			type={type}
			disabled={isDisabled || undefined}
			onClick={(event) => {
				if (isDisabled) {
					return;
				}
				onClick?.(event);
			}}
			className={classes}
			data-ui-component="button"
			data-ui-button-variant={variant}
			data-ui-button-size={size}
		>
			{loading ? <Spinner aria-hidden /> : null}
			{children}
		</button>
	);
}

export function Spinner({ className }: { className?: string }) {
	return <span aria-hidden className={clsx("ui-Spinner", className)} data-ui-component="spinner" />;
}
