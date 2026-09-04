"use client";

import { useGraphqlQuery as useQuery } from "@/lib/graphql/hooks";
import Link from "next/link";

import { useAppSession } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Table, Td, Tr } from "@/components/ui/table";
import { AUDIT_EVENTS_QUERY, ORGANIZATION_QUERY, OVERVIEW_QUERY } from "@/lib/graphql/operations";
import type {
	AuditEvent,
	AuditEventsQueryResult,
	Connection,
	Directory,
	Organization,
	OrganizationMember,
	OrganizationQueryResult,
	OverviewQueryResult,
	Role,
} from "@/lib/graphql/types";
import { formatDate, humanizeAction, relativeTime } from "@/lib/format";
import { getErrorMessage } from "@/lib/utils";
import {
	AUDIT_WINDOW_DAYS,
	overviewAuditEventsVariables,
	overviewVariables,
} from "@/lib/graphql/page-queries";

export function OverviewWidgets({
	auditRange,
	auditWindowDays = AUDIT_WINDOW_DAYS,
}: {
	/** Server-computed range so the prefetched audit query key matches the client. */
	auditRange: { rangeStart: string; rangeEnd: string };
	auditWindowDays?: number;
}) {
	const { organizationId } = useAppSession();
	// Members, roles, SSO connections and directories arrive as one operation.
	const overview = useQuery<OverviewQueryResult>(OVERVIEW_QUERY, {
		variables: overviewVariables(),
	});

	const organization = useQuery<OrganizationQueryResult>(ORGANIZATION_QUERY, {
		variables: { id: organizationId },
	});

	const auditEvents = useQuery<AuditEventsQueryResult>(AUDIT_EVENTS_QUERY, {
		variables: overviewAuditEventsVariables(auditRange),
	});

	// Waits on every query, including the two that degrade on their own, so the
	// page paints in one pass instead of card by card.
	if (overview.isPending || organization.isPending || auditEvents.isPending) {
		return <PageSkeleton />;
	}

	// `organization` and `auditEvents` render a fallback inside their own card,
	// so only the operation the rest of the page cannot render without is gated here.
	if (overview.isError) {
		return (
			<EmptyState
				title="Overview unavailable"
				description={overview.error?.message ?? "Could not load the overview."}
			/>
		);
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Overview unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<OverviewWidgetsImpl
				auditWindowDays={auditWindowDays}
				members={overview.data.organizationMemberships.data}
				roles={overview.data.roles.roles}
				multipleRolesEnabled={overview.data.roles.multipleRolesEnabled}
				ssoConnections={overview.data.ssoConnections}
				directories={overview.data.directoryConnections.data}
				organization={organization.data?.organization ?? null}
				organizationError={organization.error}
				auditEvents={auditEvents.data?.auditEvents.data ?? null}
				auditEventsError={auditEvents.error}
			/>
		</ErrorBoundary>
	);
}

export function OverviewWidgetsImpl({
	auditWindowDays,
	members,
	roles,
	multipleRolesEnabled,
	ssoConnections,
	directories,
	organization,
	organizationError,
	auditEvents,
	auditEventsError,
}: {
	auditWindowDays: number;
	members: OrganizationMember[];
	roles: Role[];
	multipleRolesEnabled: boolean;
	ssoConnections: Connection[];
	directories: Directory[];
	/** Null with an error when the query failed; the card renders its own fallback. */
	organization: Organization | null;
	organizationError: Error | null;
	auditEvents: AuditEvent[] | null;
	auditEventsError: Error | null;
}) {
	const active = members.filter((member) => member.status === "Active");
	const pending = members.filter((member) => member.status === "Invited");
	const activeSso = ssoConnections.filter((connection) => connection.setupComplete);
	const linkedDirectories = directories.filter((directory) => directory.state === "linked");

	return (
		<div className="OverviewPage">
			<div className="OverviewStatGrid">
				<Stat
					label="Members"
					value={active.length}
					hint={`${pending.length} pending invitation${pending.length === 1 ? "" : "s"}`}
				/>
				<Stat
					label="Roles"
					value={roles.length}
					hint={multipleRolesEnabled ? "Multiple roles enabled" : "One role per member"}
				/>
				<Stat
					label="SSO connections"
					value={ssoConnections.length}
					hint={`${activeSso.length} active`}
				/>
				<Stat
					label="Directories"
					value={directories.length}
					hint={`${linkedDirectories.length} linked`}
				/>
			</div>

			<div className="OverviewSplit">
				<div className="OverviewActivityColumn">
					<Card>
						<CardHeader
							title="Recent activity"
							description={`Audit events from the last ${auditWindowDays} days.`}
							actions={
								<Link href="/audit-logs" className="OverviewHeaderLink">
									View all
								</Link>
							}
						/>
						{auditEventsError ? (
							<EmptyState title="Audit events unavailable" description={auditEventsError.message} />
						) : !auditEvents?.length ? (
							<EmptyState
								title="No recent activity"
								description="Audit events for this organization will appear here."
							/>
						) : (
							<Table>
								<tbody>
									{auditEvents.map((event) => (
										<Tr key={event.id}>
											<Td className="OverviewActivityCell">
												<p className="OverviewActivityAction">{humanizeAction(event.action)}</p>
												<p className="OverviewActivityActor">
													{event.actor.name ?? event.actor.id}
												</p>
											</Td>
											<Td className="OverviewActivityTime">{relativeTime(event.occurredAt)}</Td>
										</Tr>
									))}
								</tbody>
							</Table>
						)}
					</Card>
				</div>

				<div className="OverviewSideColumn">
					<Card>
						<CardHeader title="Organization" />
						<CardBody>
							{organization ? (
								<dl className="OverviewDetailList">
									<Row label="Name" value={organization.name} />
									<Row
										label="ID"
										value={<code className="OverviewDetailCode">{organization.id}</code>}
									/>
									<Row label="Created" value={formatDate(organization.createdAt)} />
									<Row
										label="External profiles"
										value={
											<Badge
												tone={organization.allowProfilesOutsideOrganization ? "caution" : "neutral"}
											>
												{organization.allowProfilesOutsideOrganization ? "Allowed" : "Restricted"}
											</Badge>
										}
									/>
								</dl>
							) : (
								<EmptyState
									title="Organization unavailable"
									description={
										organizationError?.message ??
										"The token is not scoped to a readable organization."
									}
								/>
							)}
						</CardBody>
					</Card>
				</div>
			</div>
		</div>
	);
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
	return (
		<Card className="OverviewStat">
			<p className="OverviewStatLabel">{label}</p>
			<p className="OverviewStatValue">{value}</p>
			<p className="OverviewStatHint">{hint}</p>
		</Card>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="OverviewRow">
			<dt className="OverviewRowLabel">{label}</dt>
			<dd className="OverviewRowValue">{value}</dd>
		</div>
	);
}
