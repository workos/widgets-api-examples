import * as React from "react";
import clsx from "clsx";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<div className="ui-TableScroller scrollbar-slim" data-ui-component="table-scroller">
			<table className={clsx("ui-Table", className)} data-ui-component="table">
				{children}
			</table>
		</div>
	);
}

export function Th({
	children,
	className,
	...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { children?: React.ReactNode }) {
	return (
		<th {...props} className={clsx("ui-Th", className)} data-ui-component="th">
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
		<td {...props} className={clsx("ui-Td", className)} data-ui-component="td">
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
	return (
		<tr
			className={clsx("ui-Tr", className)}
			data-ui-component="tr"
			data-ui-table-row-dim={dim || undefined}
		>
			{children}
		</tr>
	);
}
