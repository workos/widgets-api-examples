import * as React from "react";
import clsx from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
	return (
		<section className={clsx("ui-Card", className)} data-ui-component="card">
			{children}
		</section>
	);
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
		<header className={clsx("ui-CardHeader", className)} data-ui-component="card-header">
			<div className="ui-CardHeading">
				<h2 className="ui-CardTitle">{title}</h2>
				{description ? <p className="ui-CardDescription">{description}</p> : null}
			</div>
			{actions ? <div className="ui-CardActions">{actions}</div> : null}
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
	return (
		<div
			className={clsx("ui-CardBody", className)}
			data-ui-component="card-body"
			data-ui-card-body-padded={padded}
		>
			{children}
		</div>
	);
}

export function CardFooter({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<footer className={clsx("ui-CardFooter", className)} data-ui-component="card-footer">
			{children}
		</footer>
	);
}
