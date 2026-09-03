"use client";
import { useGraphqlQuery as useQuery, usePageReady } from "@/lib/graphql/hooks";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageSkeleton, Skeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { displayName, formatDateTime } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import {
	DIRECTORY_CONNECTION_QUERY,
	DIRECTORY_GROUPS_QUERY,
	DIRECTORY_USERS_QUERY,
} from "@/lib/graphql/operations";
import type {
	DirectoryConnectionQueryResult,
	DirectoryGroupsQueryResult,
	DirectoryUsersQueryResult,
} from "@/lib/graphql/types";
import { directoryGroupsVariables, directoryUsersVariables } from "@/lib/graphql/page-queries";

export function DirectoryDetailsWidget({ directoryId }: { directoryId: string }) {
	const directory = useQuery<DirectoryConnectionQueryResult>(DIRECTORY_CONNECTION_QUERY, {
		variables: { id: directoryId },
	});

	if (directory.isPending) {
		return <PageSkeleton />;
	}

	if (directory.isError) {
		return (
			<EmptyState
				title="Directory unavailable"
				description={directory.error?.message ?? "Could not load the directory."}
			/>
		);
	}

	const directoryConnection = directory.data.directoryConnection;
	if (!directoryConnection) {
		return <EmptyState title="Directory not found" />;
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Directory unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<DirectoryDetailsWidgetImpl directoryConnection={directoryConnection} />
		</ErrorBoundary>
	);
}

export function DirectoryDetailsWidgetImpl({
	directoryConnection,
}: {
	directoryConnection: Exclude<DirectoryConnectionQueryResult["directoryConnection"], null>;
}) {
	const users = useQuery<DirectoryUsersQueryResult>(DIRECTORY_USERS_QUERY, {
		variables: directoryUsersVariables(directoryConnection.id),
	});

	const groups = useQuery<DirectoryGroupsQueryResult>(DIRECTORY_GROUPS_QUERY, {
		variables: directoryGroupsVariables(directoryConnection.id),
	});

	const ready = usePageReady(users, groups);

	return (
		<div className="DirectoryDetailsStack">
			<Card>
				<CardHeader
					title="Directory details"
					description={`User and group details for ${directoryConnection.name}`}
				/>
			</Card>

			<div className="DirectoryDetailsColumns">
				<Card>
					{users.isPending || !ready ? (
						<CardBody className="DirectoryDetailsSkeletonList">
							{Array.from({ length: 5 }).map((_, i) => (
								<Skeleton key={i} className="DirectoryDetailsSkeletonRow" />
							))}
						</CardBody>
					) : users.error ? (
						<EmptyState title="Users unavailable" description={users.error.message} />
					) : !users.data?.directoryUsers.data.length ? (
						<EmptyState title="No users in this directory" />
					) : (
						<Table>
							<thead>
								<tr>
									<Th>User</Th>
									<Th>State</Th>
									<Th className="DirectoryDetailsAlignRight">Updated</Th>
								</tr>
							</thead>
							<tbody>
								{users.data.directoryUsers.data.map((user) => (
									<Tr key={user.id}>
										<Td>
											<p className="DirectoryDetailsUserName">
												{displayName({
													firstName: user.firstName,
													lastName: user.lastName,
													email: user.email ?? user.username ?? user.idpId,
												})}
											</p>
											<p className="DirectoryDetailsUserEmail">{user.email ?? user.username}</p>
										</Td>
										<Td>
											<Badge
												tone={
													user.state === "active"
														? "positive"
														: user.state === "suspended"
															? "critical"
															: "neutral"
												}
											>
												{user.state}
											</Badge>
										</Td>
										<Td className="DirectoryDetailsMetaCell">{formatDateTime(user.updatedAt)}</Td>
									</Tr>
								))}
							</tbody>
						</Table>
					)}
				</Card>

				<Card>
					<CardHeader title="Directory groups" description={directoryConnection.name} />
					{groups.isPending || !ready ? (
						<CardBody className="DirectoryDetailsSkeletonList">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="DirectoryDetailsSkeletonRow" />
							))}
						</CardBody>
					) : groups.error ? (
						<EmptyState title="Groups unavailable" description={groups.error.message} />
					) : !groups.data?.directoryGroups.data.length ? (
						<EmptyState title="No groups in this directory" />
					) : (
						<Table>
							<thead>
								<tr>
									<Th>Name</Th>
									<Th>IdP ID</Th>
									<Th className="DirectoryDetailsAlignRight">Created</Th>
								</tr>
							</thead>
							<tbody>
								{groups.data.directoryGroups.data.map((group) => (
									<Tr key={group.id}>
										<Td className="DirectoryDetailsNameCell">{group.name}</Td>
										<Td>
											<code className="DirectoryDetailsIdpId">{group.idpId}</code>
										</Td>
										<Td className="DirectoryDetailsMetaCell">{formatDateTime(group.createdAt)}</Td>
									</Tr>
								))}
							</tbody>
						</Table>
					)}
				</Card>
			</div>
		</div>
	);
}
