"use client";

import * as React from "react";
import clsx from "clsx";

import styles from "./code-block.module.css";

export function CodeBlock({
	code,
	className,
	maxHeight,
}: {
	code: string;
	className?: string;
	/** Any CSS length; defaults to 20rem. */
	maxHeight?: string;
}) {
	return (
		<pre
			className={clsx(styles.pre, className)}
			style={
				maxHeight ? ({ "--code-block-max-height": maxHeight } as React.CSSProperties) : undefined
			}
		>
			<code>{code}</code>
		</pre>
	);
}

/**
 * Collapsible "here is the GraphQL this widget runs" disclosure.
 *
 * Every widget in the dashboard carries one so the example doubles as
 * documentation for the operations it demonstrates.
 */
export function QueryDisclosure({
	document,
	variables,
	label = "View GraphQL",
	extra,
}: {
	document: string | string[];
	variables?: Record<string, unknown>;
	label?: string;
	extra?: React.ReactNode;
}) {
	const [open, setOpen] = React.useState(false);
	const documents = Array.isArray(document) ? document : [document];

	return (
		<div className={styles.disclosure}>
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className={styles.toggle}
				aria-expanded={open}
			>
				<span aria-hidden className={clsx(styles.chevron, open && styles.chevronOpen)}>
					›
				</span>
				{label}
			</button>

			{open ? (
				<div className={styles.panel}>
					{documents.map((node, index) => (
						<CodeBlock key={index} code={node.trim()} />
					))}
					{variables && Object.keys(variables).length > 0 ? (
						<div>
							<p className={styles.variablesLabel}>Variables</p>
							<CodeBlock code={JSON.stringify(variables, null, 2)} maxHeight="12rem" />
						</div>
					) : null}
					{extra}
				</div>
			) : null}
		</div>
	);
}
