import * as React from "react";
import clsx from "clsx";

export function Skeleton({
	className,
	...props
}: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={clsx("ui-Skeleton", className)}
			aria-hidden
			data-ui-component="skeleton"
			{...props}
		/>
	);
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
	return (
		<div className="ui-TableSkeleton" data-ui-component="table-skeleton">
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={rowIndex} className="ui-TableSkeletonRow">
					{Array.from({ length: columns }).map((__, columnIndex) => (
						<Skeleton
							key={columnIndex}
							className="ui-TableSkeletonCell"
							data-ui-table-skeleton-cell={columnIndex === 0 ? "first" : undefined}
						/>
					))}
				</div>
			))}
		</div>
	);
}

/** Full-page placeholder shown until every primary query on a page has settled. */
export function PageSkeleton() {
	return (
		<div
			className="ui-PageSkeleton"
			aria-busy="true"
			aria-label="Loading page"
			data-ui-component="page-skeleton"
		>
			<div className="ui-PageSkeletonStats">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="ui-PageSkeletonStat" />
				))}
			</div>
			<Skeleton className="ui-PageSkeletonTable" />
			<div className="ui-PageSkeletonSplit">
				<Skeleton className="ui-PageSkeletonPanel" />
				<Skeleton className="ui-PageSkeletonPanel" />
			</div>
		</div>
	);
}

export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: React.ReactNode;
	action?: React.ReactNode;
}) {
	return (
		<div className="ui-EmptyState" data-ui-component="empty-state">
			<p className="ui-EmptyStateTitle">{title}</p>
			{description ? <p className="ui-EmptyStateDescription">{description}</p> : null}
			{action ? <div className="ui-EmptyStateAction">{action}</div> : null}
		</div>
	);
}

export type NoticeTone = "info" | "positive" | "caution" | "critical";

export function Notice({
	tone = "info",
	title,
	children,
	className,
}: {
	tone?: NoticeTone;
	title?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={clsx("ui-Notice", className)}
			data-ui-component="notice"
			data-ui-notice-tone={tone}
		>
			{title ? <p className="ui-NoticeTitle">{title}</p> : null}
			{children ? (
				<div className="ui-NoticeBody" data-ui-notice-body-titled={title ? "" : undefined}>
					{children}
				</div>
			) : null}
		</div>
	);
}

/**
 * Renders the GraphQL error union member returned by a mutation. Client API
 * mutations never throw for expected failures, they return a typed member.
 */
export function ErrorText({ children }: { children: React.ReactNode }) {
	return (
		<p className="ui-ErrorText" data-ui-component="error-text">
			{children}
		</p>
	);
}
