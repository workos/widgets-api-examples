import * as React from "react";
import clsx from "clsx";

import styles from "./card.module.css";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
	return <section className={clsx(styles.card, className)}>{children}</section>;
}

export function CardHeader({
	title,
	description,
	actions,
	className,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
}) {
	return (
		<header className={clsx(styles.header, className)}>
			<div className={styles.heading}>
				<h2 className={styles.title}>{title}</h2>
				{description ? <p className={styles.description}>{description}</p> : null}
			</div>
			{actions ? <div className={styles.actions}>{actions}</div> : null}
		</header>
	);
}

export function CardBody({
	children,
	className,
	padded = true,
}: {
	children: React.ReactNode;
	className?: string;
	padded?: boolean;
}) {
	return <div className={clsx(padded && styles.body, className)}>{children}</div>;
}

export function CardFooter({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <footer className={clsx(styles.footer, className)}>{children}</footer>;
}
