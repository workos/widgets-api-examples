import * as React from "react";
import clsx from "clsx";
import styles from "./feedback.module.css";

export function Skeleton({
	className,
	...props
}: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
	return <div className={clsx(styles.skeleton, className)} aria-hidden {...props} />;
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
	return (
		<div className={styles.tableSkeleton}>
			{Array.from({ length: rows }).map((_, rowIndex) => (
				<div key={rowIndex} className={styles.tableSkeletonRow}>
					{Array.from({ length: columns }).map((__, columnIndex) => (
						<Skeleton
							key={columnIndex}
							className={
								columnIndex === 0 ? styles.tableSkeletonCellFirst : styles.tableSkeletonCell
							}
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
		<div className={styles.pageSkeleton} aria-busy="true" aria-label="Loading page">
			<div className={styles.pageSkeletonStats}>
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className={styles.pageSkeletonStat} />
				))}
			</div>
			<Skeleton className={styles.pageSkeletonTable} />
			<div className={styles.pageSkeletonSplit}>
				<Skeleton className={styles.pageSkeletonPanel} />
				<Skeleton className={styles.pageSkeletonPanel} />
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
		<div className={styles.emptyState}>
			<p className={styles.emptyStateTitle}>{title}</p>
			{description ? <p className={styles.emptyStateDescription}>{description}</p> : null}
			{action ? <div className={styles.emptyStateAction}>{action}</div> : null}
		</div>
	);
}

export type NoticeTone = "info" | "positive" | "caution" | "critical";

const NOTICE_TONES: Record<NoticeTone, string> = {
	info: styles.info,
	positive: styles.positive,
	caution: styles.caution,
	critical: styles.critical,
};

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
		<div className={clsx(styles.notice, NOTICE_TONES[tone], className)}>
			{title ? <p className={styles.noticeTitle}>{title}</p> : null}
			{children ? (
				<div className={clsx(styles.noticeBody, title && styles.noticeBodyWithTitle)}>
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
	return <p className={styles.errorText}>{children}</p>;
}
