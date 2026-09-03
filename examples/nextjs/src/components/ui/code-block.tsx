"use client";

import * as React from "react";
import clsx from "clsx";

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
			className={clsx("ui-CodeBlock", "scrollbar-slim", className)}
			data-ui-component="code-block"
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
		<div className="ui-QueryDisclosure" data-ui-component="query-disclosure">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="ui-QueryDisclosureToggle"
				aria-expanded={open}
			>
				<span aria-hidden className="ui-QueryDisclosureChevron">
					›
				</span>
				{label}
			</button>

			{open ? (
				<div className="ui-QueryDisclosurePanel">
					{documents.map((node, index) => (
						<CodeBlock key={index} code={node.trim()} />
					))}
					{variables && Object.keys(variables).length > 0 ? (
						<div>
							<p className="ui-QueryDisclosureVariablesLabel">Variables</p>
							<CodeBlock code={JSON.stringify(variables, null, 2)} maxHeight="12rem" />
						</div>
					) : null}
					{extra}
				</div>
			) : null}
		</div>
	);
}
