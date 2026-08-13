import * as React from "react";
import clsx from "clsx";

import styles from "./badge.module.css";

export type BadgeTone = "neutral" | "accent" | "positive" | "caution" | "critical";

const TONES: Record<BadgeTone, string> = {
	neutral: styles.neutral,
	accent: styles.accent,
	positive: styles.positive,
	caution: styles.caution,
	critical: styles.critical,
};

const DOT_TONES: Record<BadgeTone, string | undefined> = {
	neutral: undefined,
	accent: styles.dotAccent,
	positive: styles.dotPositive,
	caution: styles.dotCaution,
	critical: styles.dotCritical,
};

export function Badge({
	tone = "neutral",
	children,
	className,
}: {
	tone?: BadgeTone;
	children: React.ReactNode;
	className?: string;
}) {
	return <span className={clsx(styles.badge, TONES[tone], className)}>{children}</span>;
}

export function Dot({ tone = "neutral" }: { tone?: BadgeTone }) {
	return <span aria-hidden className={clsx(styles.dot, DOT_TONES[tone])} />;
}
