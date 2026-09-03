"use client";

import * as React from "react";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
} from "@/lib/graphql/hooks";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { EmptyState, ErrorText, PageSkeleton, TableSkeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { displayName, relativeTime } from "@/lib/format";
import {
	EFFECTIVE_PERMISSIONS_QUERY,
	INVITE_USER_MUTATION,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	REMOVE_MEMBER_MUTATION,
	RESEND_INVITATION_MUTATION,
	REVOKE_INVITATION_MUTATION,
	ROLES_QUERY,
	UPDATE_MEMBER_ROLE_MUTATION,
} from "@/lib/graphql/operations";
import type {
	InviteUserMutationResult,
	OrganizationMember,
	OrganizationMembershipsQueryResult,
	OrganizationMemberStatus,
	RemoveMemberMutationResult,
	ResendInvitationMutationResult,
	RevokeInvitationMutationResult,
	Role,
	RolesQueryResult,
	UpdateMemberRoleMutationResult,
} from "@/lib/graphql/types";
import { unionErrorMessage } from "@/lib/graphql/union";
import { membersPageVariables } from "@/lib/graphql/page-queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useResetDialogKey } from "@/lib/use-reset-dialog-key";
import { getErrorMessage } from "@/lib/utils";

const STATUS_TONE: Record<OrganizationMemberStatus, BadgeTone> = {
	Active: "positive",
	Invited: "accent",
	InviteExpired: "caution",
	InviteRevoked: "critical",
	NoInvite: "neutral",
};

export function MembersWidget() {
	const roles = useQuery<RolesQueryResult>(ROLES_QUERY);

	if (roles.isPending) {
		return <PageSkeleton />;
	}

	if (roles.isError) {
		return (
			<EmptyState
				title="Members unavailable"
				description={roles.error?.message ?? "Could not load roles."}
			/>
		);
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Members unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<MembersWidgetImpl roles={roles.data.roles.roles} />
		</ErrorBoundary>
	);
}

export function MembersWidgetImpl({ roles }: { roles: Role[] }) {
	const [search, setSearch] = React.useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [roleSlug, setRoleSlug] = React.useState("");
	const [after, setAfter] = React.useState<string | null>(null);
	const [inviteDialogIsOpen, setInviteDialogIsOpen] = React.useState(false);
	const inviteDialogKey = useResetDialogKey(inviteDialogIsOpen);

	const variables = React.useMemo(
		() => ({
			...membersPageVariables(),
			search: debouncedSearch.trim() || null,
			roleSlug: roleSlug || null,
			after,
		}),
		[debouncedSearch, roleSlug, after],
	);

	const members = useQuery<OrganizationMembershipsQueryResult>(ORGANIZATION_MEMBERSHIPS_QUERY, {
		variables,
	});

	const list = members.data?.organizationMemberships;

	return (
		<div className="MembersWidget">
			<Card>
				<CardHeader
					title="Organization members"
					description="Search, invite, change roles, and manage pending invitations."
					actions={
						<Button variant="primary" size="sm" onClick={() => setInviteDialogIsOpen(true)}>
							Invite
						</Button>
					}
				/>
				<CardBody padded={false}>
					<div className="MembersToolbar">
						<div className="MembersSearchField">
							<FormField
								type="search"
								name="search-by-name"
								label="Search by name or email"
								visuallyHideLabel
								value={search}
								onChange={(event) => {
									setSearch(event.target.value);
									setAfter(null);
								}}
								placeholder="Search by name or email"
							/>
						</div>
						<FormField
							type="select"
							name="role-filter"
							label="Role filter"
							visuallyHideLabel
							value={roleSlug}
							onChange={(event) => {
								setRoleSlug(event.target.value);
								setAfter(null);
							}}
							options={[
								{ label: "All roles", value: "" },
								...roles.map((role) => ({ label: role.name, value: role.slug })),
							]}
						/>
					</div>

					{members.isPending && !list ? (
						<TableSkeleton rows={6} columns={5} />
					) : members.error ? (
						<EmptyState title="Members unavailable" description={members.error.message} />
					) : !list?.data.length ? (
						<EmptyState
							title="No members match"
							description="Try a different search or clear the role filter."
						/>
					) : (
						<Table>
							<thead>
								<tr>
									<Th>Member</Th>
									<Th>Role</Th>
									<Th>Status</Th>
									<Th>Last active</Th>
									<Th className="MembersActionsHeader">Actions</Th>
								</tr>
							</thead>
							<tbody>
								{list.data.map((member) => (
									<MemberRow
										key={member.id}
										member={member}
										roles={roles}
										onRemoved={() => setAfter(null)}
									/>
								))}
							</tbody>
						</Table>
					)}
				</CardBody>
				<CardFooter>
					<div className="MembersPagination">
						<Button size="sm" disabled={!list?.listMetadata.before} onClick={() => setAfter(null)}>
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
			<InviteDialog
				key={inviteDialogKey}
				open={inviteDialogIsOpen}
				onOpenChange={setInviteDialogIsOpen}
				roles={roles}
				onInvited={() => {
					setAfter(null);
					setInviteDialogIsOpen(false);
				}}
			/>
		</div>
	);
}

function MemberRow({
	member,
	roles,
	onRemoved,
}: {
	member: OrganizationMember;
	roles: { slug: string; name: string }[];
	onRemoved: () => void;
}) {
	const currentRole = member.roles[0]?.slug ?? "";
	const pending = member.status !== "Active";
	const [roleError, setRoleError] = React.useState<string | null>(null);
	const [actionError, setActionError] = React.useState<string | null>(null);

	const updateMutation = useMutation<UpdateMemberRoleMutationResult>(UPDATE_MEMBER_ROLE_MUTATION, {
		invalidate: [ORGANIZATION_MEMBERSHIPS_QUERY, EFFECTIVE_PERMISSIONS_QUERY],
		onSuccess: (data) => {
			const error = unionErrorMessage(data.updateMemberRole);
			if (error) {
				setRoleError(error);
				return;
			}
			setRoleError(null);
		},
		onError: (error) => setRoleError(error.message),
	});

	const removeMutation = useMutation<RemoveMemberMutationResult>(REMOVE_MEMBER_MUTATION, {
		invalidate: [ORGANIZATION_MEMBERSHIPS_QUERY],
		onSuccess: (data) => {
			const error = unionErrorMessage(data.removeMember);
			if (error) {
				setActionError(error);
				return;
			}
			setActionError(null);
			onRemoved();
		},
		onError: (error) => setActionError(error.message),
	});

	const revokeMutation = useMutation<RevokeInvitationMutationResult>(REVOKE_INVITATION_MUTATION, {
		invalidate: [ORGANIZATION_MEMBERSHIPS_QUERY],
		onSuccess: (data) => {
			const error = unionErrorMessage(data.revokeInvitation);
			if (error) {
				setActionError(error);
				return;
			}
			setActionError(null);
		},
		onError: (error) => setActionError(error.message),
	});

	const resendMutation = useMutation<ResendInvitationMutationResult>(RESEND_INVITATION_MUTATION, {
		invalidate: [ORGANIZATION_MEMBERSHIPS_QUERY],
		onSuccess: (data) => {
			const error = unionErrorMessage(data.resendInvitation);
			if (error) {
				setActionError(error);
				return;
			}
			setActionError(null);
		},
		onError: (error) => setActionError(error.message),
	});

	return (
		<Tr>
			<Td>
				<div className="MembersMember">
					<Avatar
						size="sm"
						email={member.email}
						firstName={member.firstName}
						lastName={member.lastName}
						src={member.profilePictureUrl}
					/>
					<div className="MembersMemberText">
						<p className="MembersMemberName truncate">{displayName(member)}</p>
						<p className="MembersMemberEmail truncate">{member.email}</p>
					</div>
				</div>
			</Td>
			<Td>
				<div className="MembersRoleCell">
					<FormField
						disabled={pending || updateMutation.isPending}
						type="select"
						name="role-for-member"
						label={`Role for ${member.email}`}
						visuallyHideLabel
						value={currentRole}
						invalid={Boolean(roleError)}
						invalidText={roleError}
						onChange={(event) => {
							if (!pending) {
								setRoleError(null);
								void updateMutation.mutate({
									input: { userId: member.id, roleSlugs: [event.target.value] },
								});
							}
						}}
						options={roles.map((role) => ({ label: role.name, value: role.slug }))}
					/>
				</div>
			</Td>
			<Td>
				<Badge tone={STATUS_TONE[member.status]}>{member.status}</Badge>
			</Td>
			<Td className="MembersLastActiveCell">{relativeTime(member.lastActivityAt)}</Td>
			<Td className="MembersActionsCell">
				<div className="MembersActions">
					<div className="MembersActionButtons">
						{pending ? (
							<>
								<Button
									size="sm"
									variant="ghost"
									loading={resendMutation.isPending}
									onClick={() => {
										setActionError(null);
										void resendMutation.mutate({
											input: { userId: member.id },
										});
									}}
								>
									Resend
								</Button>
								{member.status === "Invited" ? (
									<Button
										size="sm"
										variant="ghost"
										loading={revokeMutation.isPending}
										onClick={() => {
											setActionError(null);
											void revokeMutation.mutate({
												input: { userId: member.id },
											});
										}}
									>
										Revoke
									</Button>
								) : null}
							</>
						) : (
							<Button
								size="sm"
								variant="danger"
								loading={removeMutation.isPending}
								onClick={() => {
									setActionError(null);
									void removeMutation.mutate({
										input: { userId: member.id },
									});
								}}
							>
								Remove
							</Button>
						)}
					</div>
					{actionError ? <ErrorText>{actionError}</ErrorText> : null}
				</div>
			</Td>
		</Tr>
	);
}

function InviteDialog({
	roles,
	open,
	onOpenChange,
	onInvited,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	roles: { slug: string; name: string; isDefault: boolean }[];
	onInvited: () => void;
}) {
	const [error, setError] = React.useState<string | null>(null);
	const inviteMutation = useMutation<InviteUserMutationResult>(INVITE_USER_MUTATION, {
		invalidate: [ORGANIZATION_MEMBERSHIPS_QUERY],
		onSuccess: (result) => {
			const message = unionErrorMessage(result.inviteUser);
			if (message) {
				setError(message);
				return;
			}
			setError(null);
			onInvited();
		},
		onError: (error) => setError(error.message),
	});

	const loading = inviteMutation.isPending;

	const defaultRole = roles.find((role) => role.isDefault)?.slug ?? roles[0]?.slug ?? "";
	const [email, setEmail] = React.useState("");
	const [roleSlug, setRoleSlug] = React.useState(defaultRole);
	const [expiresInDays, setExpiresInDays] = React.useState("7");

	const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		void inviteMutation.mutate({
			email: email.trim(),
			roleSlug: roleSlug || undefined,
			expiresInDays: Number(expiresInDays) || undefined,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			title="Invite a member"
			description="Sends an invitation email. The invitee joins with the selected role."
			footer={
				<>
					<DialogClose>
						<Button variant="ghost">Cancel</Button>
					</DialogClose>
					<Button variant="primary" loading={loading} form="invite-form" type="submit">
						Send invitation
					</Button>
				</>
			}
		>
			<form id="invite-form" className="MembersForm" onSubmit={handleSubmit}>
				<FormField
					type="email"
					name="email"
					label="Email"
					required
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="teammate@company.com"
				/>
				<FormField
					type="select"
					name="role"
					label="Role"
					value={roleSlug}
					onChange={(event) => setRoleSlug(event.target.value)}
					options={roles.map((role) => ({ label: role.name, value: role.slug }))}
				/>
				<FormField
					type="number"
					name="expires-in-days"
					label="Expires in (days)"
					description="Between 1 and 30."
					min={1}
					max={30}
					value={expiresInDays}
					onChange={(event) => setExpiresInDays(event.target.value)}
				/>
				{error ? <ErrorText>{error}</ErrorText> : null}
			</form>
		</Dialog>
	);
}
