"use client";
import * as React from "react";
import { useGraphqlQuery as useQuery } from "@/lib/graphql/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { relativeTime } from "@/lib/format";
import { DIRECTORY_CONNECTIONS_QUERY } from "@/lib/graphql/operations";
import type { Directory, DirectoryConnectionsQueryResult } from "@/lib/graphql/types";
import { directoryPageVariables } from "@/lib/graphql/page-queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getErrorMessage } from "@/lib/utils";
import Link from "next/link";
import cn from "clsx";

import styles from "./directories.module.css";

export function DirectoriesWidget() {
	const directories = useQuery<DirectoryConnectionsQueryResult>(DIRECTORY_CONNECTIONS_QUERY, {
		variables: directoryPageVariables(),
	});

	if (directories.isPending) {
		return <PageSkeleton />;
	}

	if (directories.isError) {
		return <EmptyState title="Directories unavailable" description={directories.error.message} />;
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Directories unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<DirectoriesWidgetImpl directories={directories.data.directoryConnections.data} />
		</ErrorBoundary>
	);
}

export function DirectoriesWidgetImpl({ directories }: { directories: Directory[] }) {
	const [search, setSearch] = React.useState("");
	const debouncedSearch = useDebouncedValue(search).trim();
	const isSearchActive = debouncedSearch !== "";

	const filteredDirectoriesResult = useQuery<DirectoryConnectionsQueryResult>(
		DIRECTORY_CONNECTIONS_QUERY,
		{
			variables: {
				...directoryPageVariables(),
				search: debouncedSearch,
			},
			enabled: isSearchActive,
			// Without this, each new term resets to no data and the table would
			// briefly show every directory again
			keepPreviousData: true,
		},
	);

	// `filteredDirectoriesResult` still holds the last term's rows as placeholder
	// data once the search is cleared, so ignore it unless a search is active.
	const directoryList = isSearchActive
		? (filteredDirectoriesResult.data?.directoryConnections.data ?? directories)
		: directories;

	const isSearching =
		isSearchActive &&
		(filteredDirectoriesResult.isPending || filteredDirectoriesResult.isPlaceholderData);

	return (
		<div className={styles.stack}>
			<Card>
				<CardHeader
					title="Directory connections"
					description="Directory Sync connections for this organization. Select one to browse users and groups."
				/>
				<CardBody padded={false}>
					<div className={styles.searchRow}>
						<FormField
							name="search-by-name"
							placeholder="Filter by name"
							label="Search directories"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>

					{filteredDirectoriesResult.error ? (
						<EmptyState
							title="Directories unavailable"
							description={filteredDirectoriesResult.error.message}
						/>
					) : !directoryList.length ? (
						<EmptyState title="No directory connections" />
					) : (
						<Table>
							<thead>
								<tr>
									<Th>Name</Th>
									<Th>Type</Th>
									<Th>State</Th>
									<Th>External key</Th>
									<Th className={styles.alignRight}>Updated</Th>
								</tr>
							</thead>
							<tbody>
								{directoryList.map((directory) => (
									<Tr key={directory.id} dim={isSearching}>
										<Td>
											<Link
												href={`/directory/${directory.id}`}
												className={cn(
													styles.directoryLink,
													isSearching ? styles.directoryLinkDim : styles.directoryLinkActive,
												)}
												aria-disabled={isSearching || undefined}
												onClick={(event) => {
													if (isSearching) event.preventDefault();
												}}
												tabIndex={isSearching ? -1 : undefined}
											>
												{directory.name}
											</Link>
											<p className={styles.directoryId}>{directory.id}</p>
										</Td>
										<Td className={styles.mutedCell}>{directory.type}</Td>
										<Td>
											<Badge
												tone={directory.state === "linked" ? "positive" : "caution"}
												className={isSearching ? styles.badgeDim : undefined}
											>
												{directory.state}
											</Badge>
										</Td>
										<Td>
											<code className={styles.externalKey}>{directory.externalKey}</code>
										</Td>
										<Td className={styles.updatedCell}>{relativeTime(directory.updatedAt)}</Td>
									</Tr>
								))}
							</tbody>
						</Table>
					)}
				</CardBody>
			</Card>
		</div>
	);
}
