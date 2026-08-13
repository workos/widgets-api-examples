import clsx from "clsx";

import styles from "./avatar.module.css";

const PALETTE = [
	styles.palette0,
	styles.palette1,
	styles.palette2,
	styles.palette3,
	styles.palette4,
	styles.palette5,
];

const SIZES = {
	sm: styles.sm,
	md: styles.md,
	lg: styles.lg,
};

function initials(firstName?: string | null, lastName?: string | null, email?: string) {
	const first = firstName?.trim()?.[0];
	const last = lastName?.trim()?.[0];
	if (first && last) return `${first}${last}`.toUpperCase();
	if (first) return first.toUpperCase();
	return (email?.trim()?.[0] ?? "?").toUpperCase();
}

function paletteIndex(seed: string) {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) {
		hash = (hash * 31 + seed.charCodeAt(index)) % 997;
	}
	return hash % PALETTE.length;
}

export function Avatar({
	firstName,
	lastName,
	email,
	src,
	size = "md",
	className,
}: {
	firstName?: string | null;
	lastName?: string | null;
	email: string;
	src?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
}) {
	if (src) {
		return (
			// eslint-disable-next-line @next/next/no-img-element -- avatar hosts vary per IdP
			<img src={src} alt="" className={clsx(styles.image, SIZES[size], className)} />
		);
	}

	return (
		<span
			aria-hidden
			className={clsx(styles.avatar, PALETTE[paletteIndex(email)], SIZES[size], className)}
		>
			{initials(firstName, lastName, email)}
		</span>
	);
}
