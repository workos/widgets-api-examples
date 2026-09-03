"use client";

import * as React from "react";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
	usePageReady,
	usePrefetchGraphqlQuery,
} from "@/lib/graphql/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { EmptyState, ErrorText, PageSkeleton, Skeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDateTime, humanizeAction, relativeTime } from "@/lib/format";
import {
	AUDIT_EVENT_QUERY,
	AUDIT_EVENTS_QUERY,
	AUDIT_LOG_EXPORT_QUERY,
	CREATE_AUDIT_LOG_EXPORT_MUTATION,
} from "@/lib/graphql/operations";
import type {
	AuditEvent,
	AuditEventQueryResult,
	AuditEventsQueryResult,
	AuditLogExportQueryResult,
	CreateAuditLogExportMutationResult,
} from "@/lib/graphql/types";
import { isType, unionErrorMessage } from "@/lib/graphql/union";
import { auditEventsVariables } from "@/lib/graphql/page-queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { getErrorMessage } from "@/lib/utils";

export function AuditLogsWidget({
	initialRange,
}: {
	/** Server-computed defaults so the prefetched events query key matches the client. */
	initialRange: { rangeStart: string; rangeEnd: string };
}) {
	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Audit events unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<AuditLogsWidgetImpl initialRange={initialRange} />
		</ErrorBoundary>
	);
}

/**
 * The events query is driven by the filters and pagination below it, so it stays
 * with that state and reports its own loading and error states inline — hoisting
 * it would flash the page skeleton on every keystroke.
 */
export function AuditLogsWidgetImpl({
	initialRange,
}: {
	initialRange: { rangeStart: string; rangeEnd: string };
}) {
	const prefetch = usePrefetchGraphqlQuery();
	const [rangeStart, setRangeStart] = React.useState(initialRange.rangeStart);
	const [rangeEnd, setRangeEnd] = React.useState(initialRange.rangeEnd);
	const [search, setSearch] = React.useState("");
	const [after, setAfter] = React.useState<string | null>(null);

	const [exportState, exportMutation] = useAuditLogsExportState();

	type DialogState =
		| { activeDialog: null; eventId: string | null }
		| { activeDialog: "view"; eventId: string };
	type DialogAction = { type: "open-view"; eventId: string } | { type: "close" };
	const [dialogState, dialogDispatch] = React.useReducer(
		(state: DialogState, action: DialogAction): DialogState => {
			switch (action.type) {
				case "open-view":
					return state.activeDialog === "view"
						? state
						: { activeDialog: "view", eventId: action.eventId };
				case "close":
					return state.activeDialog === null
						? state
						: { activeDialog: null, eventId: state.eventId };
			}
		},
		{
			activeDialog: null,
			eventId: null,
		},
	);

	const debouncedSearch = useDebouncedValue(search);
	const debouncedRangeStart = useDebouncedValue(rangeStart);
	const debouncedRangeEnd = useDebouncedValue(rangeEnd);

	const eventVariables = auditEventsVariables({
		rangeStart: debouncedRangeStart,
		rangeEnd: debouncedRangeEnd,
		search: debouncedSearch,
		after,
	});

	const events = useQuery<AuditEventsQueryResult>(AUDIT_EVENTS_QUERY, {
		variables: eventVariables,
	});

	const ready = usePageReady(events);

	const list = events.data?.auditEvents;

	if (!ready) {
		return <PageSkeleton />;
	}

	const canExport =
		exportState.status !== "create-pending" && exportState.status !== "create-started";

	return (
		<div className="AuditLogsPage">
			<Card>
				<CardHeader
					title="Audit events"
					description="Date range is required. Other filters are optional and combined with AND."
					actions={
						<Button
							size="sm"
							variant="primary"
							loading={!canExport}
							onClick={() => {
								if (canExport) {
									void exportMutation.mutate({
										input: {
											rangeStart: eventVariables.filter.rangeStart,
											rangeEnd: eventVariables.filter.rangeEnd,
										},
									});
								}
							}}
						>
							Start export
						</Button>
					}
				/>
				<CardBody padded={false}>
					<div className="AuditLogsFilters">
						<FormField
							type="datetime-local"
							name="rangeStart"
							label="From"
							value={rangeStart}
							onChange={(event) => {
								exportMutation.reset();
								setRangeStart(event.target.value);
								setAfter(null);
							}}
						/>
						<FormField
							type="datetime-local"
							name="rangeEnd"
							label="To"
							value={rangeEnd}
							onChange={(event) => {
								exportMutation.reset();
								setRangeEnd(event.target.value);
								setAfter(null);
							}}
						/>
						<FormField
							type="search"
							name="search"
							label="Search"
							value={search}
							onChange={(event) => {
								setSearch(event.target.value);
								setAfter(null);
							}}
						/>
					</div>

					{exportState.error ? (
						<div className="AuditLogsExportError">
							<ErrorText>{exportState.error}</ErrorText>
						</div>
					) : null}

					{exportState.status === "create-pending" ||
					exportState.status === "create-started" ||
					exportState.status === "created" ? (
						<div className="AuditLogsExportStatus">
							Export{" "}
							{exportState.data?.id ? (
								<code className="AuditLogsExportId">{exportState.data.id}</code>
							) : (
								<Skeleton className="AuditLogsExportIdSkeleton AuditLogsExportId">
									audit_log_export_00000000000000
								</Skeleton>
							)}
							{exportState.status === "created" ? (
								<Badge tone="positive">Ready</Badge>
							) : (
								<Badge tone="caution">Pending</Badge>
							)}
							{exportState.data?.url ? (
								<Button asChild size="sm" className="AuditLogsExportDownload">
									<a href={exportState.data.url} download={`${exportState.data.id}.csv`}>
										Download CSV
									</a>
								</Button>
							) : null}
						</div>
					) : null}

					{events.isPending && !list ? (
						<div className="AuditLogsEventsSkeleton">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="AuditLogsEventsSkeletonRow" />
							))}
						</div>
					) : events.error ? (
						<EmptyState title="Audit events unavailable" description={events.error.message} />
					) : !list?.data.length ? (
						<EmptyState title="No events in this range" />
					) : (
						<Table>
							<thead>
								<tr>
									<Th>Action</Th>
									<Th>Actor</Th>
									<Th>Targets</Th>
									<Th className="AuditLogsWhenHeader">When</Th>
								</tr>
							</thead>
							<tbody>
								{list.data.map((event) => (
									<EventRow
										key={event.id}
										event={event}
										onSelect={() => {
											dialogDispatch({ type: "open-view", eventId: event.id });
										}}
										onPrefetch={() => prefetch(AUDIT_EVENT_QUERY, { id: event.id })}
									/>
								))}
							</tbody>
						</Table>
					)}
				</CardBody>
				<CardFooter>
					<div className="AuditLogsPagination">
						<Button size="sm" disabled={!after} onClick={() => setAfter(null)}>
							First page
						</Button>
						<Button
							size="sm"
							disabled={!list?.listMetadata.after}
							onClick={() => setAfter(list?.listMetadata.after ?? null)}
						>
							Next
						</Button>
					</div>
				</CardFooter>
			</Card>

			<EventDetailDialog
				open={dialogState.activeDialog === "view"}
				onClose={() => dialogDispatch({ type: "close" })}
				eventId={dialogState.eventId}
			/>
		</div>
	);
}

function EventDetailDialog({
	eventId,
	open,
	onClose,
}: {
	eventId: string | null;
	open: boolean;
	onClose: () => void;
}) {
	const detail = useQuery<AuditEventQueryResult>(AUDIT_EVENT_QUERY, {
		variables: { id: eventId },
		enabled: eventId != null,
	});

	const { isPending: loading, error, data } = detail;
	const event = data?.auditEvent ?? null;

	return (
		<Dialog
			width="lg"
			title={event ? humanizeAction(event.action) : "Event detail"}
			description={event ? event.action : "Fetched with auditEvent(id)."}
			open={open}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			footer={
				<DialogClose>
					<Button variant="ghost">Close</Button>
				</DialogClose>
			}
		>
			{loading ? (
				<Skeleton className="AuditLogsDetailSkeleton" />
			) : error ? (
				<ErrorText>{error.message}</ErrorText>
			) : event ? (
				<div className="AuditLogsDetail">
					<dl className="AuditLogsDetailGrid">
						<div>
							<dt className="AuditLogsDetailLabel">Occurred</dt>
							<dd>{formatDateTime(event.occurredAt)}</dd>
						</div>
						<div>
							<dt className="AuditLogsDetailLabel">Actor</dt>
							<dd>
								{event.actor.name ?? event.actor.id}
								<span className="AuditLogsActorType">({event.actor.type})</span>
							</dd>
						</div>
						<div className="AuditLogsDetailWide">
							<dt className="AuditLogsDetailLabel">Targets</dt>
							<dd className="AuditLogsTargetList">
								{event.targets.map((target) => (
									<code key={target} className="AuditLogsTarget">
										{target}
									</code>
								))}
							</dd>
						</div>
						<div className="AuditLogsDetailWide">
							<dt className="AuditLogsDetailLabel">ID</dt>
							<dd className="AuditLogsDetailId">{event.id}</dd>
						</div>
					</dl>
					<div>
						<p className="AuditLogsDataLabel">data</p>
						<CodeBlock code={JSON.stringify(event.data ?? {}, null, 2)} maxHeight="14rem" />
					</div>
				</div>
			) : (
				<EmptyState title="Event not found" />
			)}
		</Dialog>
	);
}

function EventRow({
	event,
	onSelect,
	onPrefetch,
}: {
	event: AuditEvent;
	onSelect: () => void;
	onPrefetch: () => void;
}) {
	return (
		<Tr>
			<Td>
				<button
					type="button"
					onClick={onSelect}
					onMouseEnter={onPrefetch}
					onFocus={onPrefetch}
					className="AuditLogsActionButton"
				>
					{humanizeAction(event.action)}
				</button>
				<p className="AuditLogsActionSlug">{event.action}</p>
			</Td>
			<Td className="AuditLogsActorCell">
				{event.actor.name ?? event.actor.id}
				<p className="AuditLogsActorTypeLine">{event.actor.type}</p>
			</Td>
			<Td>
				<div className="AuditLogsTargets">
					{event.targets.slice(0, 2).map((target) => (
						<code key={target} className="AuditLogsTargetTag">
							{target}
						</code>
					))}
				</div>
			</Td>
			<Td className="AuditLogsWhenCell">{relativeTime(event.occurredAt)}</Td>
		</Tr>
	);
}

type AuditLogExportState =
	| { status: "idle"; error: null; data: null }
	| { status: "create-started"; error: null; data: null }
	| { status: "create-pending"; error: null; data: { id: string; url: null } }
	| { status: "created"; error: null; data: { id: string; url: string } }
	| { status: "error"; error: string; data: null | { id: null | string; url: null } };

function useAuditLogsExportState() {
	const exportMutation = useMutation<CreateAuditLogExportMutationResult>(
		CREATE_AUDIT_LOG_EXPORT_MUTATION,
		{
			onSuccess: (data) => {
				if (!isType(data.createAuditLogExport, "AuditLogExport")) {
					console.error("Unexpected response type", data.createAuditLogExport);
				}
			},
			onError: (error) => {
				console.error("Unexpected error", error);
			},
		},
	);

	const shouldPollForExportStatus =
		exportMutation.status === "success" &&
		exportMutation.data.createAuditLogExport.state === "Pending";

	const exportStatus = useQuery<AuditLogExportQueryResult>(AUDIT_LOG_EXPORT_QUERY, {
		variables: shouldPollForExportStatus
			? { id: exportMutation.data.createAuditLogExport.id as string }
			: undefined,
		enabled: shouldPollForExportStatus,
		refetchInterval: (data) => (data?.auditLogExport?.state === "Pending" ? 1_000 : false),
	});

	// We can derive the state of the export from both the mutation and the status
	// query. This looks verbose but it's more fool-proof than managing states
	// manually and coordinating via effects.
	const exportState: AuditLogExportState = ((): AuditLogExportState => {
		// The status query is only enabled if the export mutation succeeded and
		// returned an ID, so its status becomes the source-of-truth for state.
		if (exportStatus.isEnabled) {
			switch (exportStatus.status) {
				case "success":
					switch (exportStatus.data.auditLogExport.state) {
						case "Ready":
							return {
								status: "created",
								error: null,
								data: {
									id: exportStatus.data.auditLogExport.id,
									url: exportStatus.data.auditLogExport.url!,
								},
							};
						case "Pending":
							return {
								status: "create-pending",
								error: null,
								data: { id: exportStatus.data.auditLogExport.id, url: null },
							};
						case "Error":
						case "Expired":
							return getAuditLogsExportErrorState(
								exportStatus.data.auditLogExport.state,
								exportStatus.data.auditLogExport.id,
							);
						default:
							exportStatus.data.auditLogExport.state satisfies never;
							return getAuditLogsExportErrorState("Error", null, "Unexpected export state");
					}
				case "pending":
					if (!exportMutation.data) {
						// should be a `never` case since the query should be disabled
						throw new Error("Unexpected export state");
					}

					return {
						status: "create-pending",
						error: null,
						data: { id: exportMutation.data.createAuditLogExport.id as string, url: null },
					};
				case "error":
					return getAuditLogsExportErrorState(
						"Error",
						exportStatus.data?.auditLogExport.id ?? exportMutation.data?.createAuditLogExport.id,
						exportStatus.error?.message,
					);
				default:
					exportStatus satisfies never;
					throw new Error("Unexpected export status");
			}
		}

		switch (exportMutation.status) {
			case "idle":
				return {
					status: "idle",
					error: null,
					data: null,
				};
			case "pending":
				return {
					status: "create-started",
					error: null,
					data: null,
				};
			case "error": {
				return getAuditLogsExportErrorState("Error", null, exportMutation.error?.message);
			}
			case "success": {
				const error = unionErrorMessage(exportMutation.data.createAuditLogExport);
				if (error) {
					return getAuditLogsExportErrorState("Error", null, error);
				}

				if (!isType(exportMutation.data.createAuditLogExport, "AuditLogExport")) {
					return getAuditLogsExportErrorState("Error", null);
				}

				switch (exportMutation.data.createAuditLogExport.state) {
					case "Ready":
						return {
							status: "created",
							error: null,
							data: {
								id: exportMutation.data.createAuditLogExport.id as string,
								// TODO The URL will be undefined until the API is updated to
								// return a URL if the export is ready from the initial
								// mutation. This can be the case for cases where a mutation
								// using the same variables is used is triggered more than once,
								// so the API must be updated to account for this.
								url: exportMutation.data.createAuditLogExport.url as string,
							},
						};
					case "Pending":
						return {
							status: "create-started",
							error: null,
							data: null,
						};
					case "Error":
					case "Expired":
						return getAuditLogsExportErrorState(
							exportMutation.data.createAuditLogExport.state,
							exportMutation.data.createAuditLogExport.id,
						);
					default:
						// @ts-expect-error: TODO This should typecheck correctly
						exportMutation.data.createAuditLogExport.state satisfies never;
						return getAuditLogsExportErrorState("Error", null, "Unexpected export state");
				}
			}
			default:
				exportMutation satisfies never;
				throw new Error("Unexpected export mutation status");
		}
	})();

	return [exportState, exportMutation] as const;
}

function getAuditLogsExportErrorState(
	state: "Error" | "Expired",
	id: unknown,
	message?: unknown,
): AuditLogExportState & { status: "error" } {
	return {
		status: "error",
		error:
			typeof message === "string"
				? message
				: state === "Expired"
					? "The export expired before it could be downloaded."
					: "The export failed to generate. Try starting it again.",
		data: typeof id === "string" ? { id, url: null } : null,
	};
}
