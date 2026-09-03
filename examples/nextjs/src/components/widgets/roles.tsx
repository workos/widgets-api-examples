"use client";

import * as React from "react";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
} from "@/lib/graphql/hooks";

import { useAppSession } from "@/components/shell/session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { EmptyState, ErrorText, PageSkeleton, Skeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { PlusIcon } from "@radix-ui/react-icons";
import {
	CREATE_ROLE_MUTATION,
	DELETE_ROLE_MUTATION,
	EFFECTIVE_PERMISSIONS_QUERY,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	PERMISSIONS_QUERY,
	ROLES_QUERY,
	UPDATE_ROLE_MUTATION,
} from "@/lib/graphql/operations";
import type {
	CreateRoleMutationResult,
	DeleteRoleMutationResult,
	EffectivePermissionsQueryResult,
	OrganizationMember,
	OrganizationMembershipsQueryResult,
	Permission,
	PermissionsQueryResult,
	Role,
	RolesQueryResult,
	UpdateRoleMutationResult,
} from "@/lib/graphql/types";
import { displayName } from "@/lib/format";
import {
	rolesEffectiveVariables,
	rolesMembersVariables,
	rolesPermissionsVariables,
} from "@/lib/graphql/page-queries";
import { CheckboxGroup, Checkbox } from "@/components/ui/checkbox";
import { useResetDialogKey } from "@/lib/use-reset-dialog-key";
import { getErrorMessage } from "@/lib/utils";

export function RolesWidget() {
	const roles = useQuery<RolesQueryResult>(ROLES_QUERY);
	const permissions = useQuery<PermissionsQueryResult>(PERMISSIONS_QUERY, {
		variables: rolesPermissionsVariables(),
	});
	const members = useQuery<OrganizationMembershipsQueryResult>(ORGANIZATION_MEMBERSHIPS_QUERY, {
		variables: rolesMembersVariables(),
	});

	if (roles.isPending || permissions.isPending || members.isPending) {
		return <PageSkeleton />;
	}

	if (roles.isError) {
		return (
			<EmptyState
				title="Roles unavailable"
				description={roles.error?.message ?? "Could not load roles."}
			/>
		);
	}

	if (permissions.isError) {
		return (
			<EmptyState
				title="Permissions unavailable"
				description={permissions.error?.message ?? "Could not load permissions."}
			/>
		);
	}

	if (members.isError) {
		return (
			<EmptyState
				title="Members unavailable"
				description={members.error?.message ?? "Could not load members."}
			/>
		);
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Roles unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<RolesWidgetImpl
				roles={roles.data.roles.roles}
				permissions={permissions.data.permissions.data}
				members={members.data.organizationMemberships.data}
			/>
		</ErrorBoundary>
	);
}

export function RolesWidgetImpl({
	roles,
	permissions,
	members,
}: {
	roles: Role[];
	permissions: Permission[];
	members: OrganizationMember[];
}) {
	const { userId } = useAppSession();
	const [inspectUserId, setInspectUserId] = React.useState("");
	const [deletingId, setDeletingId] = React.useState<string | null>(null);

	// Parameterized by the member being inspected, so it stays here and renders
	// its own loading state rather than gating the page on every selection.
	// `effectivePermissions` requires a user, so the "You" option resolves to the
	// signed-in user rather than being left off the query.
	const effective = useQuery<EffectivePermissionsQueryResult>(EFFECTIVE_PERMISSIONS_QUERY, {
		variables: rolesEffectiveVariables(inspectUserId || userId),
	});

	type DialogState =
		| { activeDialog: "create" | null; editing: Role | null }
		| { activeDialog: "edit" | null; editing: Role };
	type DialogAction =
		| { type: "open-create" }
		| { type: "open-edit"; role: Role }
		| { type: "close" };
	const [dialogState, dialogDispatch] = React.useReducer(
		(state: DialogState, action: DialogAction): DialogState => {
			switch (action.type) {
				case "open-create":
					return state.activeDialog === "create"
						? state
						: { activeDialog: "create", editing: state.editing };
				case "open-edit":
					return state.activeDialog === "edit" && action.role === state.editing
						? state
						: { activeDialog: "edit", editing: action.role };
				case "close":
					return state.activeDialog === null
						? state
						: { activeDialog: null, editing: state.editing };
			}
		},
		{
			activeDialog: null,
			editing: null,
		},
	);

	const deleteMutation = useMutation<DeleteRoleMutationResult>(DELETE_ROLE_MUTATION, {
		invalidate: [ROLES_QUERY, ORGANIZATION_MEMBERSHIPS_QUERY, EFFECTIVE_PERMISSIONS_QUERY],
		onSuccess: () => {
			setDeletingId(null);
		},
	});

	const activeMembers = members.filter((member) => member.status === "Active");

	const permissionBySlug = React.useMemo(
		() => new Map(permissions.map((permission) => [permission.slug, permission])),
		[permissions],
	);

	return (
		<div className="RolesWidget">
			<Card>
				<CardHeader
					title="Roles"
					description="Manage user roles and their permissions."
					actions={
						<Button
							variant="primary"
							size="sm"
							onClick={() => dialogDispatch({ type: "open-create" })}
						>
							<PlusIcon aria-hidden height={15} width={15} />
							New role
						</Button>
					}
				/>
				<CardBody className="RolesRoleList">
					{roles.map((role) => (
						<div key={role.id} className="RolesRoleCard">
							<div className="RolesRoleCardTop">
								<div>
									<div className="RolesRoleNameRow">
										<p className="RolesRoleName">{role.name}</p>
										{role.isDefault ? <Badge tone="accent">Default</Badge> : null}
									</div>
									<p className="RolesRoleSlug">{role.slug}</p>
									{role.description ? (
										<p className="RolesRoleDescription">{role.description}</p>
									) : null}
								</div>
								<div className="RolesRoleActions">
									<Button size="sm" onClick={() => dialogDispatch({ type: "open-edit", role })}>
										Edit
									</Button>
									{!role.isDefault ? (
										<Button
											size="sm"
											variant="danger"
											loading={deleteMutation.isPending && deletingId === role.id}
											onClick={() => {
												if (
													confirm(
														`Delete role “${role.name}”? Members on this role move to the default role.`,
													)
												) {
													setDeletingId(role.id);
													void deleteMutation.mutate({ input: { id: role.id } });
												}
											}}
										>
											Delete
										</Button>
									) : null}
								</div>
							</div>
							{deleteMutation.error && deletingId === role.id ? (
								<div className="RolesRoleError">
									<ErrorText>{deleteMutation.error.message}</ErrorText>
								</div>
							) : null}
						</div>
					))}
				</CardBody>
			</Card>

			<div className="RolesPanels">
				<Card>
					<CardHeader title="Environment permissions" />
					<CardBody className="RolesPermissionList scrollbar-slim">
						{permissions.map((permission) => (
							<div key={permission.id} className="RolesPermissionRow">
								<div className="RolesPermissionText">
									<p className="RolesPermissionSlug">{permission.slug}</p>
									<p className="RolesPermissionName">{permission.name}</p>
								</div>
								{permission.system ? (
									<Badge tone="neutral">System</Badge>
								) : (
									<Badge tone="accent">Custom</Badge>
								)}
							</div>
						))}
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="Effective permissions" />
					<CardBody className="RolesEffectiveBody">
						<FormField
							type="select"
							name="member"
							label="Member"
							value={inspectUserId}
							onChange={(event) => setInspectUserId(event.target.value)}
							options={[
								{ label: "You (current user)", value: "" },
								...activeMembers.map((member) => ({
									label: displayName(member),
									value: member.id,
								})),
							]}
						/>
						{effective.isPending ? (
							<Skeleton className="RolesEffectiveSkeleton" />
						) : effective.error ? (
							<EmptyState
								title="Could not load effective permissions"
								description={effective.error.message}
							/>
						) : (
							<div className="RolesPermissionChips">
								{(effective.data?.effectivePermissions ?? []).map((permission) => (
									<code
										key={permission.id}
										title={permissionBySlug.get(permission.slug)?.description ?? undefined}
										className="RolesPermissionChip"
									>
										{permission.slug}
									</code>
								))}
								{!effective.data?.effectivePermissions.length ? (
									<p className="RolesNoPermissions">No permissions.</p>
								) : null}
							</div>
						)}
					</CardBody>
				</Card>
			</div>

			<CreateRoleDialog
				title="Create role"
				open={dialogState.activeDialog === "create"}
				onOpenChange={(open) => {
					dialogDispatch(open ? { type: "open-create" } : { type: "close" });
				}}
				permissions={permissions}
				onCreateSuccess={() => {
					dialogDispatch({ type: "close" });
				}}
			/>

			<EditRoleDialog
				title="Edit role"
				open={dialogState.activeDialog === "edit"}
				onOpenChange={(open) => {
					if (!open) dialogDispatch({ type: "close" });
				}}
				permissions={permissions}
				onUpdateSuccess={() => {
					dialogDispatch({ type: "close" });
				}}
				initial={dialogState.editing}
			/>
		</div>
	);
}

function CreateRoleDialog({
	title,
	permissions,
	open,
	onOpenChange,
	onCreateSuccess,
}: {
	title: string;
	permissions: { slug: string; name: string }[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreateSuccess: (result: CreateRoleMutationResult) => void;
}) {
	const createMutation = useMutation<CreateRoleMutationResult>(CREATE_ROLE_MUTATION, {
		invalidate: [ROLES_QUERY],
		onSuccess: onCreateSuccess,
	});

	const loading = createMutation.isPending;
	const error = createMutation.error?.message;

	const key = useResetDialogKey(open);

	return (
		<RoleFormDialog
			open={open}
			key={key}
			onOpenChange={onOpenChange}
			title={title}
			permissions={permissions}
			loading={loading}
			error={error}
			onSubmit={(input) => void createMutation.mutate({ input })}
		/>
	);
}

function EditRoleDialog({
	title,
	permissions,
	onUpdateSuccess,
	initial,
	open,
	onOpenChange,
}: {
	open: boolean;
	initial?: Role | null;
	onOpenChange: (open: boolean) => void;
	title: string;
	permissions: { slug: string; name: string }[];
	onUpdateSuccess: (result: UpdateRoleMutationResult) => void;
}) {
	const updateMutation = useMutation<UpdateRoleMutationResult>(UPDATE_ROLE_MUTATION, {
		invalidate: [ROLES_QUERY, ORGANIZATION_MEMBERSHIPS_QUERY, EFFECTIVE_PERMISSIONS_QUERY],
		onSuccess: onUpdateSuccess,
	});

	const loading = updateMutation.isPending;
	const error = updateMutation.error?.message;

	const key = useResetDialogKey(open);

	return (
		<RoleFormDialog
			open={open}
			key={key}
			onOpenChange={onOpenChange}
			title={title}
			permissions={permissions}
			loading={loading}
			error={error}
			initial={initial}
			onSubmit={({ slug: _slug, ...input }) =>
				void updateMutation.mutate({ input: { ...input, id: initial?.id } })
			}
		/>
	);
}

function RoleFormDialog({
	open,
	onOpenChange,
	title,
	permissions,
	initial,
	loading,
	error,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	permissions: { slug: string; name: string }[];
	initial?: Role | null;
	loading: boolean;
	error: string | undefined | null;
	onSubmit: (input: {
		name: string;
		slug?: string;
		description?: string;
		permissions?: string[];
	}) => void;
}) {
	type FormState = {
		name: string;
		slug: string;
		description: string;
		permissions: string[];
	};
	type FormAction =
		| { type: "change"; name: "name" | "slug" | "description"; value: string }
		| { type: "change"; name: "permissions"; value: string[] }
		| { type: "reset" };
	const initialFormState: FormState = {
		name: initial?.name ?? "",
		slug: initial?.slug ?? "",
		description: initial?.description ?? "",
		permissions: [],
	};

	const [{ name, slug, description, permissions: selected }, dispatch] = React.useReducer(
		(state: FormState, action: FormAction): FormState => {
			switch (action.type) {
				case "change":
					return state[action.name] === action.value
						? state
						: { ...state, [action.name]: action.value };
				case "reset":
					return initialFormState;
				default:
					action satisfies never;
					return state;
			}
		},
		initialFormState,
	);

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		onSubmit?.({
			name: name.trim(),
			slug: slug.trim() || undefined,
			description: description.trim() || undefined,
			permissions: selected.length ? selected : undefined,
		});
	}

	return (
		<Dialog
			open={open}
			title={title}
			width="lg"
			onOpenChange={(open) => {
				if (open) {
					dispatch({ type: "reset" });
				}
				onOpenChange(open);
			}}
			footer={
				<>
					<DialogClose>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button variant="primary" loading={loading} form="role-form" type="submit">
						Save
					</Button>
				</>
			}
		>
			<form id="role-form" className="RolesForm" onSubmit={handleSubmit}>
				<FormField
					name="name"
					required
					label="Name"
					value={name}
					onChange={(event) =>
						dispatch({ type: "change", name: "name", value: event.target.value })
					}
				/>

				{!initial ? (
					<FormField
						name="slug"
						label="Slug"
						description="Optional. Generated from the name when omitted."
						value={slug}
						onChange={(event) =>
							dispatch({ type: "change", name: "slug", value: event.target.value })
						}
						placeholder="billing-admin"
					/>
				) : null}
				<FormField
					type="textarea"
					name="description"
					rows={2}
					label="Description"
					value={description}
					onChange={(event) =>
						dispatch({ type: "change", name: "description", value: event.target.value })
					}
				/>

				<CheckboxGroup
					name="permissions"
					label="Permissions"
					value={selected}
					onValueChange={(value) => dispatch({ type: "change", name: "permissions", value })}
					description={
						initial
							? "Selecting permissions replaces the role's full set. Leave empty to keep using Assign for incremental grants."
							: "Optional starting set."
					}
				>
					<div className="RolesPermissionPicker scrollbar-slim">
						{permissions.map((permission) => (
							<Checkbox
								key={permission.slug}
								value={permission.slug}
								label={permission.slug}
								labelVariant="mono"
							/>
						))}
					</div>
				</CheckboxGroup>
				{error ? <ErrorText>{error}</ErrorText> : null}
			</form>
		</Dialog>
	);
}
