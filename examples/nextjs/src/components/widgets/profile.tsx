"use client";

import * as React from "react";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
} from "@/lib/graphql/hooks";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorText, PageSkeleton } from "@/components/ui/feedback";
import { FormField } from "@/components/ui/form-field";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { displayName, formatDateTime, relativeTime } from "@/lib/format";
import {
	ME_QUERY,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	UPDATE_PROFILE_MUTATION,
} from "@/lib/graphql/operations";
import type { MeQueryResult, UpdateProfileMutationResult, User } from "@/lib/graphql/types";
import { unionErrorMessage } from "@/lib/graphql/union";
import { getErrorMessage } from "@/lib/utils";

export function ProfileWidget() {
	const me = useQuery<MeQueryResult>(ME_QUERY);
	if (me.isPending) {
		return <PageSkeleton />;
	}

	if (me.isError) {
		return (
			<EmptyState
				title="Profile unavailable"
				description={me.error?.message ?? "Could not load me."}
			/>
		);
	}

	const user = me.data.me;

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Profile unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<ProfileWidgetImpl user={user} />
		</ErrorBoundary>
	);
}

export function ProfileWidgetImpl({ user }: { user: User }) {
	type State = {
		firstName: string;
		lastName: string;
		error: string | null;
	};
	type Action =
		| { type: "change"; name: "firstName" | "lastName"; value: string }
		| { type: "setMultiple"; values: Partial<Record<"firstName" | "lastName", string>> }
		| { type: "formError"; error: string | null };
	const [{ firstName, lastName, error }, dispatch] = React.useReducer(
		(state: State, action: Action): State => {
			switch (action.type) {
				case "change":
					return state[action.name] === action.value
						? state
						: { ...state, [action.name]: action.value };
				case "setMultiple": {
					let changed = false;
					for (const [name, value] of Object.entries(action.values)) {
						if (Object.hasOwn(state, name) && state[name as keyof State] !== value) {
							changed = true;
							state[name as keyof State] = value;
						}
					}
					return changed ? { ...state, ...action.values } : state;
				}

				case "formError":
					return action.error === state.error ? state : { ...state, error: action.error };
			}
		},
		{
			firstName: user.firstName ?? "",
			lastName: user.lastName ?? "",
			error: null,
		},
	);

	const updateMutation = useMutation<UpdateProfileMutationResult>(UPDATE_PROFILE_MUTATION, {
		invalidate: [ME_QUERY, ORGANIZATION_MEMBERSHIPS_QUERY],
		onSuccess: (data) => {
			const message = unionErrorMessage(data.updateProfile);
			if (message) {
				dispatch({ type: "formError", error: message });
				return;
			}
			dispatch({ type: "formError", error: null });
		},
		onError: (error) => dispatch({ type: "formError", error: error.message }),
	});

	function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		void updateMutation.mutate({
			input: {
				firstName,
				lastName,
			},
		});
	}

	return (
		<div className="ProfileLayout">
			<Card>
				<CardHeader title="User profile" />
				<CardBody className="ProfileProfileBody">
					<div className="ProfileIdentity">
						<Avatar
							size="lg"
							email={user.email}
							firstName={user.firstName}
							lastName={user.lastName}
							src={user.profilePictureUrl}
						/>
						<div>
							<p className="ProfileName">{displayName(user)}</p>
							<p className="ProfileEmail">{user.email}</p>
						</div>
					</div>
					<dl className="ProfileDetails">
						<Row
							label="Email verified"
							value={
								<Badge tone={user.emailVerified ? "positive" : "caution"}>
									{user.emailVerified ? "Verified" : "Unverified"}
								</Badge>
							}
						/>
						<Row
							label="MFA"
							value={
								<Badge tone={user.mfaEnabled ? "positive" : "neutral"}>
									{user.mfaEnabled ? "Enabled" : "Off"}
								</Badge>
							}
						/>
						<Row label="MFA last used" value={relativeTime(user.mfaLastUsedAt)} />
						<Row label="Created" value={formatDateTime(user.createdAt)} />
						<Row label="Updated" value={formatDateTime(user.updatedAt)} />
						<Row label="User ID" value={<code className="ProfileUserId">{user.id}</code>} />
					</dl>
				</CardBody>
			</Card>

			<div className="ProfileColumn">
				<Card>
					<CardHeader title="Update profile" />
					<CardBody>
						<form className="ProfileForm" onSubmit={handleSubmit}>
							<div className="ProfileNameFields">
								<FormField
									name="first-name"
									label="First name"
									value={firstName}
									disabled={updateMutation.isPending}
									onChange={(event) =>
										dispatch({ type: "change", name: "firstName", value: event.target.value })
									}
								/>
								<FormField
									name="last-name"
									label="Last name"
									value={lastName}
									disabled={updateMutation.isPending}
									onChange={(event) =>
										dispatch({ type: "change", name: "lastName", value: event.target.value })
									}
								/>
							</div>
							{error ? <ErrorText>{error}</ErrorText> : null}
							<Button variant="primary" type="submit" loading={updateMutation.isPending}>
								Save changes
							</Button>
						</form>
					</CardBody>
				</Card>

				<Card>
					<CardHeader
						title="Connected accounts"
						description={`OAuth profiles linked to ${displayName(user)}.`}
					/>
					<CardBody className="ProfileAccounts">
						{user.connectedAccounts.length === 0 ? (
							<p className="ProfileAccountsEmpty">No connected accounts.</p>
						) : (
							user.connectedAccounts.map((account) => (
								<div key={account.id} className="ProfileAccount">
									<div>
										<p className="ProfileAccountProvider">{account.provider}</p>
										<p className="ProfileAccountEmail">
											{account.email ?? "No email from provider"}
										</p>
									</div>
									<p className="ProfileAccountTime">{relativeTime(account.lastLoginAt)}</p>
								</div>
							))
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="ProfileRow">
			<dt className="ProfileRowLabel">{label}</dt>
			<dd className="ProfileRowValue">{value}</dd>
		</div>
	);
}
