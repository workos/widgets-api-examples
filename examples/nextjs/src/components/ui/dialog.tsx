"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import clsx from "clsx";

import styles from "./dialog.module.css";

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
				<DialogPrimitive.Overlay className={styles.overlay} />
				<DialogPrimitive.Content {...props} ref={ref} className={clsx(styles.content, className)}>
					<div className={clsx(styles.panel, width === "lg" ? styles.widthLg : styles.widthMd)}>
						<header className={styles.header}>
							{title ? (
								<DialogPrimitive.Title asChild>
									<h2 className={styles.title}>{title}</h2>
								</DialogPrimitive.Title>
							) : null}
							{description ? (
								<DialogPrimitive.Description asChild>
									<p className={styles.description}>{description}</p>
								</DialogPrimitive.Description>
							) : null}
						</header>
						<div className={styles.body}>{children}</div>
						{footer ? <footer className={styles.footer}>{footer}</footer> : null}
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
