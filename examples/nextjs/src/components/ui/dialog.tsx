"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import clsx from "clsx";

function Dialog({
	ref,
	title,
	description,
	children,
	footer,
	width = "md",
	className,
	trigger,
	open,
	defaultOpen,
	onOpenChange,
	modal,
	...props
}: {
	ref?: React.Ref<HTMLDivElement>;
	title: React.ReactNode;
	description?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	width?: "md" | "lg";
	trigger?: React.ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	modal?: boolean;
} & Omit<React.DialogHTMLAttributes<HTMLDivElement>, "title" | "children">) {
	return (
		<DialogPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={onOpenChange}
			modal={modal}
		>
			{trigger}
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="ui-DialogOverlay" data-ui-component="dialog-overlay" />
				<DialogPrimitive.Content
					{...props}
					ref={ref}
					className={clsx("ui-DialogContent", className)}
					data-ui-component="dialog-content"
				>
					<div
						className="ui-DialogPanel"
						data-ui-component="dialog-panel"
						data-ui-dialog-width={width}
					>
						<header className="ui-DialogHeader">
							{title ? (
								<DialogPrimitive.Title asChild>
									<h2 className="ui-DialogTitle">{title}</h2>
								</DialogPrimitive.Title>
							) : null}
							{description ? (
								<DialogPrimitive.Description asChild>
									<p className="ui-DialogDescription">{description}</p>
								</DialogPrimitive.Description>
							) : null}
						</header>
						<div className="ui-DialogBody">{children}</div>
						{footer ? <footer className="ui-DialogFooter">{footer}</footer> : null}
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

function DialogTrigger({ children }: { children: React.ReactNode }) {
	return <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>;
}

function DialogClose({ children }: { children: React.ReactNode }) {
	return <DialogPrimitive.Close asChild>{children}</DialogPrimitive.Close>;
}

export { Dialog, DialogTrigger, DialogClose };
