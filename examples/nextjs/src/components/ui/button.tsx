import * as React from "react";
import { Slot } from "radix-ui";
import clsx from "clsx";

import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
	primary: styles.primary,
	secondary: styles.secondary,
	ghost: styles.ghost,
	danger: styles.danger,
};

const SIZES: Record<Size, string> = {
	sm: styles.sm,
	md: styles.md,
};

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
	const classes = clsx(styles.button, VARIANTS[variant], SIZES[size], className);

	if (asChild) {
		return (
			<Slot.Root {...props} onClick={onClick} className={classes}>
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
		>
			{loading ? <Spinner aria-hidden /> : null}
			{children}
		</button>
	);
}

export function Spinner({ className }: { className?: string }) {
	return <span aria-hidden className={clsx(styles.spinner, className)} />;
}
