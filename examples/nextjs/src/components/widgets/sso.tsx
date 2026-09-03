"use client";

import * as React from "react";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
} from "@/lib/graphql/hooks";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { EmptyState, ErrorText, PageSkeleton, Skeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { PlusIcon } from "@radix-ui/react-icons";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDateTime, humanizeConnectionType } from "@/lib/format";
import {
	CREATE_SSO_CONNECTION_MUTATION,
	DELETE_SSO_CONNECTION_MUTATION,
	SSO_CONNECTION_QUERY,
	SSO_CONNECTIONS_QUERY,
	UPDATE_SSO_CONNECTION_MUTATION,
} from "@/lib/graphql/operations";
import type {
	Connection,
	ConnectionState,
	ConnectionType,
	CreateSsoConnectionMutationResult,
	DeleteSsoConnectionMutationResult,
	SsoConnectionQueryResult,
	SsoConnectionsQueryResult,
	UpdateSsoConnectionMutationResult,
} from "@/lib/graphql/types";
import { useResetDialogKey } from "@/lib/use-reset-dialog-key";
import { getErrorMessage } from "@/lib/utils";

const STATE_TONE: Record<ConnectionState, BadgeTone> = {
	Active: "positive",
	Inactive: "neutral",
	Validating: "caution",
	Deleting: "critical",
};

const CONNECTION_TYPES: ConnectionType[] = [
	"OktaSAML",
	"AzureSAML",
	"GenericSAML",
	"GoogleSAML",
	"JumpCloudSAML",
	"PingOneSAML",
	"EntraIdOIDC",
	"GenericOIDC",
	"OktaOIDC",
];

export function SsoWidget() {
	const connections = useQuery<SsoConnectionsQueryResult>(SSO_CONNECTIONS_QUERY);

	if (connections.isPending) {
		return <PageSkeleton />;
	}

	if (connections.isError) {
		return (
			<EmptyState
				title="SSO connections unavailable"
				description={connections.error?.message ?? "Could not load SSO connections."}
			/>
		);
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="SSO connections unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<SsoWidgetImpl connections={connections.data.ssoConnections} />
		</ErrorBoundary>
	);
}

export function SsoWidgetImpl({ connections }: { connections: Connection[] }) {
	const [detailId, setDetailId] = React.useState<string | null>(null);
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	type DialogState =
		| { activeDialog: "create" | null; renaming: Connection | null }
		| { activeDialog: "rename"; renaming: Connection };
	type DialogAction =
		| { type: "open-create" }
		| { type: "open-rename"; connection: Connection }
		| { type: "close" };
	const [dialogState, dialogDispatch] = React.useReducer(
		(state: DialogState, action: DialogAction): DialogState => {
			switch (action.type) {
				case "open-create":
					return state.activeDialog === "create"
						? state
						: { activeDialog: "create", renaming: state.renaming };
				case "open-rename":
					return state.activeDialog === "rename" && action.connection === state.renaming
						? state
						: { activeDialog: "rename", renaming: action.connection };
				case "close":
					return state.activeDialog === null
						? state
						: { activeDialog: null, renaming: state.renaming };
			}
		},
		{
			activeDialog: null,
			renaming: null,
		},
	);

	const renameDialogKey = useResetDialogKey(dialogState.activeDialog === "rename");
	const createDialogKey = useResetDialogKey(dialogState.activeDialog === "create");

	const detail = useQuery<SsoConnectionQueryResult>(SSO_CONNECTION_QUERY, {
		variables: { id: detailId! },
		enabled: detailId != null,
	});

	const deleteMutation = useMutation<DeleteSsoConnectionMutationResult>(
		DELETE_SSO_CONNECTION_MUTATION,
		{
			invalidate: [SSO_CONNECTIONS_QUERY, SSO_CONNECTION_QUERY],
			onSuccess: () => {
				setDeletingId(null);
				setDetailId(null);
			},
		},
	);

	return (
		<div className="SsoStack">
			<Card>
				<CardHeader
					title="SSO connections"
					description="SAML and OIDC connections for this organization. New connections start inactive until IdP setup is finished."
					actions={
						<Button
							variant="primary"
							size="sm"
							onClick={() => dialogDispatch({ type: "open-create" })}
						>
							<PlusIcon aria-hidden height={15} width={15} />
							Add connection
						</Button>
					}
				/>
				{!connections.length ? (
					<EmptyState
						title="No SSO connections"
						description="Create a SAML or OIDC connection to get started."
						action={
							<Button
								size="sm"
								variant="primary"
								onClick={() => dialogDispatch({ type: "open-create" })}
							>
								Add connection
							</Button>
						}
					/>
				) : (
					<Table>
						<thead>
							<tr>
								<Th>Name</Th>
								<Th>Type</Th>
								<Th>State</Th>
								<Th>Setup</Th>
								<Th className="SsoAlignRight">Actions</Th>
							</tr>
						</thead>
						<tbody>
							{connections.map((connection) => (
								<Tr key={connection.id}>
									<Td>
										<button
											type="button"
											className="SsoNameButton"
											onClick={() => setDetailId(connection.id)}
										>
											{connection.name}
										</button>
										<p className="SsoConnectionId">{connection.id}</p>
									</Td>
									<Td className="SsoMutedCell">{humanizeConnectionType(connection.type)}</Td>
									<Td>
										<Badge tone={STATE_TONE[connection.state]}>{connection.state}</Badge>
									</Td>
									<Td>
										<Badge tone={connection.setupComplete ? "positive" : "caution"}>
											{connection.setupComplete ? "Complete" : "Pending"}
										</Badge>
									</Td>
									<Td className="SsoAlignRight">
										<div className="SsoRowActions">
											<div className="SsoRowActionButtons">
												<Button
													type="button"
													size="sm"
													variant="ghost"
													onClick={() => dialogDispatch({ type: "open-rename", connection })}
												>
													Rename
												</Button>
												<Button
													size="sm"
													variant="danger"
													loading={deleteMutation.isPending && deletingId === connection.id}
													onClick={() => {
														if (confirm(`Delete “${connection.name}”?`)) {
															setDeletingId(connection.id);
															void deleteMutation.mutate({ id: connection.id });
														}
													}}
												>
													Delete
												</Button>
											</div>
											{deleteMutation.error && deletingId === connection.id ? (
												<ErrorText>{deleteMutation.error.message}</ErrorText>
											) : null}
										</div>
									</Td>
								</Tr>
							))}
						</tbody>
					</Table>
				)}
			</Card>

			{detailId ? (
				<Card>
					<CardHeader
						title="Connection detail"
						description="Fetched with ssoConnection(id)."
						actions={
							<Button size="sm" variant="ghost" onClick={() => setDetailId(null)}>
								Close
							</Button>
						}
					/>
					<CardBody>
						{detail.isPending ? (
							<Skeleton className="SsoDetailSkeleton" />
						) : detail.data?.ssoConnection ? (
							<dl className="SsoDetailGrid">
								{(
									[
										["Name", detail.data.ssoConnection.name],
										["Type", humanizeConnectionType(detail.data.ssoConnection.type)],
										["State", detail.data.ssoConnection.state],
										["Setup complete", detail.data.ssoConnection.setupComplete ? "Yes" : "No"],
										["Created", formatDateTime(detail.data.ssoConnection.createdAt)],
										["Updated", formatDateTime(detail.data.ssoConnection.updatedAt)],
									] as const
								).map(([label, value]) => (
									<div key={label}>
										<dt className="SsoDetailLabel">{label}</dt>
										<dd className="SsoDetailValue">{value}</dd>
									</div>
								))}
							</dl>
						) : (
							<EmptyState title="Connection not found" />
						)}
					</CardBody>
				</Card>
			) : null}

			<CreateDialog
				key={createDialogKey}
				open={dialogState.activeDialog === "create"}
				onOpenChange={(open) => dialogDispatch({ type: open ? "open-create" : "close" })}
				onCreateSuccess={() => {
					dialogDispatch({ type: "close" });
				}}
			/>

			<RenameDialog
				key={renameDialogKey}
				open={dialogState.activeDialog === "rename"}
				onClose={() => dialogDispatch({ type: "close" })}
				connection={dialogState.renaming}
				onUpdateSuccess={() => {
					dialogDispatch({ type: "close" });
				}}
			/>
		</div>
	);
}

function CreateDialog({
	open,
	onOpenChange,
	onCreateSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateSuccess: (result: CreateSsoConnectionMutationResult) => void;
}) {
	const [type, setType] = React.useState<ConnectionType>("OktaSAML");
	const [name, setName] = React.useState("");

	const createMutation = useMutation<CreateSsoConnectionMutationResult>(
		CREATE_SSO_CONNECTION_MUTATION,
		{
			invalidate: [SSO_CONNECTIONS_QUERY],
			onSuccess: onCreateSuccess,
		},
	);

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		void createMutation.mutate({ input: { type, name: name.trim() || undefined } });
	}

	const loading = createMutation.isPending;
	const error = createMutation.error?.message;

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Create SSO connection"
			description="Only SAML and OIDC types are accepted."
			footer={
				<>
					<DialogClose>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button variant="primary" loading={loading} form="sso-create" type="submit">
						Create
					</Button>
				</>
			}
		>
			<form id="sso-create" className="SsoForm" onSubmit={handleSubmit}>
				<FormField
					name="type"
					type="select"
					label="Type"
					value={type}
					onChange={(event) => setType(event.target.value as ConnectionType)}
					options={CONNECTION_TYPES.map((value) => ({
						label: humanizeConnectionType(value),
						value,
					}))}
				/>
				<FormField
					name="name"
					label="Name"
					description="Defaults to the organization name when omitted."
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
				{error ? <ErrorText>{error}</ErrorText> : null}
			</form>
		</Dialog>
	);
}

function RenameDialog({
	connection,
	open,
	onClose,
	onUpdateSuccess,
}: {
	open: boolean;
	onClose: () => void;
	onUpdateSuccess: (result: UpdateSsoConnectionMutationResult) => void;
	connection: Connection | null;
}) {
	const [name, setName] = React.useState(connection?.name ?? "");

	const updateMutation = useMutation<UpdateSsoConnectionMutationResult>(
		UPDATE_SSO_CONNECTION_MUTATION,
		{
			invalidate: [SSO_CONNECTIONS_QUERY, SSO_CONNECTION_QUERY],
			onSuccess: onUpdateSuccess,
		},
	);

	const loading = updateMutation.isPending;
	const error = updateMutation.error?.message;

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) {
					onClose();
				}
			}}
			title="Rename connection"
			footer={
				<>
					<DialogClose>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button variant="primary" loading={loading} form="sso-rename" type="submit">
						Save
					</Button>
				</>
			}
		>
			<form
				id="sso-rename"
				className="SsoForm"
				onSubmit={(event) => {
					event.preventDefault();
					if (connection) {
						void updateMutation.mutate({ input: { id: connection.id, name: name.trim() } });
					}
				}}
			>
				<FormField
					name="name"
					label="Name"
					required
					value={name}
					onChange={(event) => setName(event.target.value)}
				/>
				{error ? <ErrorText>{error}</ErrorText> : null}
			</form>
		</Dialog>
	);
}
