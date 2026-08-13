import * as React from "react";
import clsx from "clsx";

import styles from "./table.module.css";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={styles.scroller}>
			<table className={clsx(styles.table, className)}>{children}</table>
		</div>
	);
}

export function Th({
	children,
	className,
	...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
	return (
		<th {...props} className={clsx(styles.th, className)}>
			{children}
		</th>
	);
}

export function Td({
	children,
	className,
	...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
	return (
		<td {...props} className={clsx(styles.td, className)}>
			{children}
		</td>
	);
}

export function Tr({
	children,
	className,
	dim,
}: {
	children: React.ReactNode;
	className?: string;
	dim?: boolean;
}) {
	return <tr className={clsx(styles.tr, dim && styles.trDim, className)}>{children}</tr>;
}
