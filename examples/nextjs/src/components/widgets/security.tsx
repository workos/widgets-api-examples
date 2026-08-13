"use client";

import * as React from "react";
import clsx from "clsx";
import {
	useGraphqlMutation as useMutation,
	useGraphqlQuery as useQuery,
} from "@/lib/graphql/hooks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorText, Notice, PageSkeleton } from "@/components/ui/feedback";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { FormField } from "@/components/ui/form-field";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { getAppMode } from "@/lib/config";
import { DEMO_VERIFICATION_CODE } from "@/lib/demo/constants";
import { describeDevice, formatDateTime, relativeTime } from "@/lib/format";
import {
	CONFIRM_EMAIL_CHANGE_MUTATION,
	CREATE_PASSWORD_MUTATION,
	ENROLL_TOTP_MUTATION,
	ME_QUERY,
	ORGANIZATION_MEMBERSHIPS_QUERY,
	PASSKEYS_QUERY,
	REMOVE_MFA_FACTOR_MUTATION,
	REVOKE_ALL_SESSIONS_MUTATION,
	REVOKE_SESSION_MUTATION,
	SEND_EMAIL_CHANGE_MUTATION,
	SEND_VERIFICATION_CODE_MUTATION,
	SESSIONS_QUERY,
	UPDATE_PASSWORD_MUTATION,
	VERIFY_CURRENT_EMAIL_MUTATION,
	VERIFY_TOTP_MUTATION,
} from "@/lib/graphql/operations";
import type {
	ConfirmEmailChangeMutationResult,
	CreatePasswordMutationResult,
	EnrollTotpMutationResult,
	MeQueryResult,
	Passkey,
	PasskeysQueryResult,
	RemoveMfaFactorMutationResult,
	RevokeAllSessionsMutationResult,
	RevokeSessionMutationResult,
	SendEmailChangeMutationResult,
	SendVerificationCodeMutationResult,
	Session,
	SessionsQueryResult,
	UpdatePasswordMutationResult,
	User,
	VerifyCurrentEmailMutationResult,
	VerifyTotpMutationResult,
} from "@/lib/graphql/types";
import { isType, unionErrorMessage } from "@/lib/graphql/union";
import { getErrorMessage } from "@/lib/utils";

import styles from "./security.module.css";

/**
 * Shared elevated-access flow: sendVerificationCode → verifyCurrentEmail.
 * Required for MFA, password create, and email change.
 */
function useElevation() {
	const [challengeId, setChallengeId] = React.useState<string | null>(null);
	const [elevatedToken, setElevatedToken] = React.useState<string | null>(null);
	const [code, setCode] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);

	const sendMutation = useMutation<SendVerificationCodeMutationResult>(
		SEND_VERIFICATION_CODE_MUTATION,
		{
			onSuccess: (data) => {
				const message = unionErrorMessage(data.sendVerificationCode);
				if (message) {
					setError(message);
					return;
				}
				if (isType(data.sendVerificationCode, "VerificationCodeSent")) {
					setChallengeId(String(data.sendVerificationCode.authenticationChallengeId));
					setError(null);
				}
			},
			onError: (error) => setError(error.message),
		},
	);

	const verifyMutation = useMutation<VerifyCurrentEmailMutationResult>(
		VERIFY_CURRENT_EMAIL_MUTATION,
		{
			onSuccess: (data) => {
				const message = unionErrorMessage(data.verifyCurrentEmail);
				if (message) {
					setError(message);
					return;
				}
				if (isType(data.verifyCurrentEmail, "CurrentEmailVerified")) {
					setElevatedToken(String(data.verifyCurrentEmail.elevatedAccessToken));
					setError(null);
				}
			},
			onError: (error) => setError(error.message),
		},
	);

	return {
		elevatedToken,
		challengeId,
		code,
		setCode,
		error,
		loading: sendMutation.isPending || verifyMutation.isPending,
		reset: () => {
			setChallengeId(null);
			setElevatedToken(null);
			setCode("");
			setError(null);
		},
		sendCode: () => void sendMutation.mutate(undefined),
		verify: () => {
			if (challengeId) {
				void verifyMutation.mutate({
					input: { authenticationChallengeId: challengeId, code: code.trim() },
				});
			}
		},
	};
}

function ElevationPanel({
	elevation,
	purpose,
}: {
	elevation: ReturnType<typeof useElevation>;
	purpose: string;
}) {
	const demo = getAppMode() === "demo";

	if (elevation.elevatedToken) {
		return (
			<Notice tone="positive" title="Identity verified">
				Elevated access token ready for {purpose}.
			</Notice>
		);
	}

	return (
		<div className={styles.elevation}>
			<p className={styles.elevationText}>
				Sensitive changes require re-authentication via email code (
				<code className={styles.elevationCode}>sendVerificationCode</code> →{" "}
				<code className={styles.elevationCode}>verifyCurrentEmail</code>).
			</p>
			{demo ? (
				<Notice tone="info" title="Demo mode">
					Use verification code <code className={styles.codeMono}>{DEMO_VERIFICATION_CODE}</code>
				</Notice>
			) : null}
			{!elevation.challengeId ? (
				<Button size="sm" loading={elevation.loading} onClick={elevation.sendCode}>
					Send verification code
				</Button>
			) : (
				<div className={styles.inlineForm}>
					<div className={styles.inlineFormField}>
						<FormField
							name="code"
							label="Code"
							value={elevation.code}
							onChange={(event) => elevation.setCode(event.target.value)}
							placeholder="6-digit code"
							inputMode="numeric"
						/>
					</div>
					<Button size="sm" loading={elevation.loading} onClick={elevation.verify}>
						Verify
					</Button>
				</div>
			)}
			{elevation.error ? <ErrorText>{elevation.error}</ErrorText> : null}
		</div>
	);
}

export function SecurityWidget() {
	const sessions = useQuery<SessionsQueryResult>(SESSIONS_QUERY);
	const passkeys = useQuery<PasskeysQueryResult>(PASSKEYS_QUERY);
	const me = useQuery<MeQueryResult>(ME_QUERY);

	if (sessions.isPending || passkeys.isPending || me.isPending) {
		return <PageSkeleton />;
	}

	if (sessions.isError) {
		return (
			<EmptyState
				title="Sessions unavailable"
				description={sessions.error?.message ?? "Could not load sessions."}
			/>
		);
	}

	if (passkeys.isError) {
		return (
			<EmptyState
				title="Passkeys unavailable"
				description={passkeys.error?.message ?? "Could not load passkeys."}
			/>
		);
	}

	if (me.isError) {
		return (
			<EmptyState
				title="Security settings unavailable"
				description={me.error?.message ?? "Could not load me."}
			/>
		);
	}

	return (
		<ErrorBoundary
			fallbackRender={({ error }) => (
				<EmptyState
					title="Security settings unavailable"
					description={getErrorMessage(error) ?? "Unknown error"}
				/>
			)}
		>
			<SecurityWidgetImpl
				sessions={sessions.data.sessions}
				passkeys={passkeys.data.passkeys}
				user={me.data.me}
			/>
		</ErrorBoundary>
	);
}

export function SecurityWidgetImpl({
	sessions,
	passkeys,
	user,
}: {
	sessions: Session[];
	passkeys: Passkey[];
	user: User;
}) {
	return (
		<div className={styles.cards}>
			<SessionsCard sessions={sessions} />
			<PasskeysCard passkeys={passkeys} />
			<PasswordCard />
			<MfaCard mfaEnabled={user.mfaEnabled ?? false} />
			<EmailChangeCard email={user.email} />
		</div>
	);
}

function SessionsCard({ sessions }: { sessions: Session[] }) {
	const [revokeAllError, setRevokeAllError] = React.useState<string | null>(null);

	const revokeAllMutation = useMutation<RevokeAllSessionsMutationResult>(
		REVOKE_ALL_SESSIONS_MUTATION,
		{
			invalidate: [SESSIONS_QUERY],
			onSuccess: (data) => {
				const error = unionErrorMessage(data.revokeAllSessions);
				if (error) {
					setRevokeAllError(error);
					return;
				}
				setRevokeAllError(null);
			},
			onError: (error) => setRevokeAllError(error.message),
		},
	);

	const active = sessions.filter((session) => session.state.tag !== "Revoked");

	return (
		<Card>
			<CardHeader
				title="Active sessions"
				description="Revoke individual sessions or everything except this one."
				actions={
					<Button
						size="sm"
						variant="danger"
						loading={revokeAllMutation.isPending}
						onClick={() => {
							setRevokeAllError(null);
							void revokeAllMutation.mutate(undefined);
						}}
					>
						Revoke all others
					</Button>
				}
			/>
			{revokeAllError ? (
				<div className={styles.errorRow}>
					<ErrorText>{revokeAllError}</ErrorText>
				</div>
			) : null}
			<Table>
				<thead>
					<tr>
						<Th>Device</Th>
						<Th>Location</Th>
						<Th>Last active</Th>
						<Th className={styles.actionsHeader}>Actions</Th>
					</tr>
				</thead>
				<tbody>
					{active.map((session) => (
						<SessionRow key={session.id} session={session} />
					))}
				</tbody>
			</Table>
		</Card>
	);
}

function SessionRow({ session }: { session: Session }) {
	const [error, setError] = React.useState<string | null>(null);
	const revokeMutation = useMutation<RevokeSessionMutationResult>(REVOKE_SESSION_MUTATION, {
		invalidate: [SESSIONS_QUERY],
		onSuccess: (data) => {
			const message = unionErrorMessage(data.revokeSession);
			if (message) {
				setError(message);
				return;
			}
			setError(null);
		},
		onError: (error) => setError(error.message),
	});

	return (
		<Tr>
			<Td>
				<div className={styles.device}>
					<span className={styles.deviceName}>{describeDevice(session.userAgent)}</span>
					{session.isCurrent ? <Badge tone="accent">Current</Badge> : null}
				</div>
				<p className={styles.deviceAddress}>{session.ipAddress ?? "—"}</p>
			</Td>
			<Td className={styles.locationCell}>
				{session.currentLocation
					? `${session.currentLocation.cityName}, ${session.currentLocation.countryISOCode}`
					: "—"}
			</Td>
			<Td className={styles.timeCell}>{relativeTime(session.lastActivityAt)}</Td>
			<Td className={styles.actionsCell}>
				{!session.isCurrent ? (
					<div className={styles.revokeActions}>
						<Button
							size="sm"
							variant="ghost"
							loading={revokeMutation.isPending}
							onClick={() => {
								setError(null);
								void revokeMutation.mutate({
									input: { sessionId: session.id },
								});
							}}
						>
							Revoke
						</Button>
						{error ? <ErrorText>{error}</ErrorText> : null}
					</div>
				) : null}
			</Td>
		</Tr>
	);
}

function PasskeysCard({ passkeys }: { passkeys: Passkey[] }) {
	return (
		<Card>
			<CardHeader
				title="Passkeys"
				description="Registered WebAuthn credentials. The Client API exposes list-only today."
			/>
			{!passkeys.length ? (
				<EmptyState title="No passkeys registered" />
			) : (
				<Table>
					<thead>
						<tr>
							<Th>ID</Th>
							<Th>Created</Th>
							<Th>Last verified</Th>
						</tr>
					</thead>
					<tbody>
						{passkeys.map((passkey) => (
							<Tr key={passkey.id}>
								<Td>
									<code className={styles.passkeyId}>{passkey.id}</code>
								</Td>
								<Td className={styles.timeCell}>{formatDateTime(passkey.createdAt)}</Td>
								<Td className={styles.timeCell}>{relativeTime(passkey.lastVerifiedAt)}</Td>
							</Tr>
						))}
					</tbody>
				</Table>
			)}
		</Card>
	);
}

function PasswordCard() {
	const elevation = useElevation();
	const [mode, setMode] = React.useState<"update" | "create">("update");
	const [currentPassword, setCurrentPassword] = React.useState("");
	const [newPassword, setNewPassword] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);

	const updateMutation = useMutation<UpdatePasswordMutationResult>(UPDATE_PASSWORD_MUTATION, {
		onSuccess: (data) => {
			const message = unionErrorMessage(data.updatePassword);
			if (message) {
				setError(message);
				return;
			}
			setCurrentPassword("");
			setNewPassword("");
			setError(null);
		},
		onError: (error) => setError(error.message),
	});

	const createMutation = useMutation<CreatePasswordMutationResult>(CREATE_PASSWORD_MUTATION, {
		onSuccess: (data) => {
			const message = unionErrorMessage(data.createPassword);
			if (message) {
				setError(message);
				return;
			}
			setNewPassword("");
			setError(null);
			elevation.reset();
		},
		onError: (error) => setError(error.message),
	});

	function submitUpdate(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		void updateMutation.mutate({
			input: { currentPassword, newPassword },
		});
	}

	function submitCreate(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!elevation.elevatedToken) return;
		void createMutation.mutate({
			input: {
				password: newPassword,
				elevatedAccessToken: elevation.elevatedToken,
			},
		});
	}

	return (
		<Card>
			<CardHeader
				title="Password"
				description="Update an existing password, or create one after verifying identity (e.g. OAuth-only accounts)."
				actions={
					<div className={styles.modeToggle}>
						<button
							type="button"
							className={clsx(
								styles.modeButton,
								mode === "update" ? styles.modeButtonActive : styles.modeButtonInactive,
							)}
							onClick={() => setMode("update")}
						>
							Update
						</button>
						<button
							type="button"
							className={clsx(
								styles.modeButton,
								mode === "create" ? styles.modeButtonActive : styles.modeButtonInactive,
							)}
							onClick={() => setMode("create")}
						>
							Create
						</button>
					</div>
				}
			/>
			<CardBody className={styles.cardStack}>
				{mode === "create" ? (
					<ElevationPanel elevation={elevation} purpose="creating a password" />
				) : null}

				{getAppMode() === "demo" && mode === "update" ? (
					<Notice tone="info" title="Demo current password">
						<code className={styles.codeMono}>correct-horse-battery-staple</code>
					</Notice>
				) : null}

				<form
					className={styles.fieldStack}
					onSubmit={mode === "update" ? submitUpdate : submitCreate}
				>
					{mode === "update" ? (
						<FormField
							name="current-password"
							label="Current password"
							type="password"
							required
							value={currentPassword}
							onChange={(event) => setCurrentPassword(event.target.value)}
						/>
					) : null}
					<FormField
						name="new-password"
						label="New password"
						type="password"
						required
						minLength={8}
						value={newPassword}
						onChange={(event) => setNewPassword(event.target.value)}
					/>
					{error ? <ErrorText>{error}</ErrorText> : null}
					<Button
						variant="primary"
						type="submit"
						loading={updateMutation.isPending || createMutation.isPending}
						disabled={mode === "create" && !elevation.elevatedToken}
					>
						{mode === "update" ? "Update password" : "Create password"}
					</Button>
				</form>
			</CardBody>
		</Card>
	);
}

function MfaCard({ mfaEnabled }: { mfaEnabled: boolean }) {
	const elevation = useElevation();
	const [enrollment, setEnrollment] = React.useState<{
		challengeId: string;
		secret: string;
		qrCode: string;
	} | null>(null);
	const [totpCode, setTotpCode] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);

	const enrollMutation = useMutation<EnrollTotpMutationResult>(ENROLL_TOTP_MUTATION, {
		onSuccess: (data) => {
			const message = unionErrorMessage(data.enrollTotp);
			if (message) {
				setError(message);
				return;
			}
			if (isType(data.enrollTotp, "TotpFactor")) {
				setEnrollment({
					challengeId: String(data.enrollTotp.authenticationChallengeId),
					secret: String(data.enrollTotp.secret),
					qrCode: String(data.enrollTotp.qrCode),
				});
				setError(null);
			}
		},
		onError: (error) => setError(error.message),
	});

	const verifyMutation = useMutation<VerifyTotpMutationResult>(VERIFY_TOTP_MUTATION, {
		invalidate: [ME_QUERY],
		onSuccess: (data) => {
			const message = unionErrorMessage(data.verifyTotp);
			if (message) {
				setError(message);
				return;
			}
			setEnrollment(null);
			setTotpCode("");
			elevation.reset();
		},
		onError: (error) => setError(error.message),
	});

	const removeMutation = useMutation<RemoveMfaFactorMutationResult>(REMOVE_MFA_FACTOR_MUTATION, {
		invalidate: [ME_QUERY],
		onSuccess: (data) => {
			const message = unionErrorMessage(data.removeMfaFactor);
			if (message) {
				setError(message);
				return;
			}
			elevation.reset();
		},
		onError: (error) => setError(error.message),
	});

	return (
		<Card>
			<CardHeader
				title="Authenticator app (TOTP)"
				description="Enroll or remove TOTP. Requires an elevated access token."
				actions={
					mfaEnabled ? (
						<Badge tone="positive">Enabled</Badge>
					) : (
						<Badge tone="neutral">Not enrolled</Badge>
					)
				}
			/>
			<CardBody className={styles.cardStack}>
				<ElevationPanel elevation={elevation} purpose="MFA changes" />

				{mfaEnabled ? (
					<Button
						variant="danger"
						loading={removeMutation.isPending}
						disabled={!elevation.elevatedToken}
						onClick={() =>
							elevation.elevatedToken &&
							void removeMutation.mutate({
								input: { elevatedAccessToken: elevation.elevatedToken },
							})
						}
					>
						Remove MFA
					</Button>
				) : !enrollment ? (
					<Button
						variant="primary"
						loading={enrollMutation.isPending}
						disabled={!elevation.elevatedToken}
						onClick={() =>
							elevation.elevatedToken &&
							void enrollMutation.mutate({
								input: { elevatedAccessToken: elevation.elevatedToken },
							})
						}
					>
						Start enrollment
					</Button>
				) : (
					<div className={styles.fieldStack}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={enrollment.qrCode} alt="TOTP QR code" className={styles.qrCode} />
						<p className={styles.secret}>
							Secret: <code className={styles.secretValue}>{enrollment.secret}</code>
						</p>
						{getAppMode() === "demo" ? (
							<Notice tone="info">Demo accepts any 6-digit code to complete enrollment.</Notice>
						) : null}
						<div className={styles.inlineForm}>
							<div className={styles.inlineFormField}>
								<FormField
									name="totp-code"
									label="Code from authenticator"
									value={totpCode}
									onChange={(event) => setTotpCode(event.target.value)}
									inputMode="numeric"
								/>
							</div>
							<Button
								variant="primary"
								loading={verifyMutation.isPending}
								onClick={() =>
									elevation.elevatedToken &&
									void verifyMutation.mutate({
										input: {
											authenticationChallengeId: enrollment.challengeId,
											code: totpCode.trim(),
											elevatedAccessToken: elevation.elevatedToken,
										},
									})
								}
							>
								Confirm
							</Button>
						</div>
					</div>
				)}
				{error ? <ErrorText>{error}</ErrorText> : null}
			</CardBody>
		</Card>
	);
}

function EmailChangeCard({ email }: { email: string }) {
	const elevation = useElevation();
	const [newEmail, setNewEmail] = React.useState("");
	const [confirmCode, setConfirmCode] = React.useState("");
	const [awaitingConfirm, setAwaitingConfirm] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const sendMutation = useMutation<SendEmailChangeMutationResult>(SEND_EMAIL_CHANGE_MUTATION, {
		onSuccess: (data) => {
			const message = unionErrorMessage(data.sendEmailChange);
			if (message) {
				setError(message);
				return;
			}
			setAwaitingConfirm(true);
			setError(null);
		},
		onError: (error) => setError(error.message),
	});

	const confirmMutation = useMutation<ConfirmEmailChangeMutationResult>(
		CONFIRM_EMAIL_CHANGE_MUTATION,
		{
			invalidate: [ME_QUERY, ORGANIZATION_MEMBERSHIPS_QUERY],
			onSuccess: (data) => {
				const message = unionErrorMessage(data.confirmEmailChange);
				if (message) {
					setError(message);
					return;
				}
				setAwaitingConfirm(false);
				setNewEmail("");
				setConfirmCode("");
				elevation.reset();
			},
			onError: (error) => setError(error.message),
		},
	);

	return (
		<Card>
			<CardHeader
				title="Change email"
				description="Verify current email, send a code to the new address, then confirm."
			/>
			<CardBody className={styles.cardStack}>
				<p className={styles.currentEmail}>
					Current: <span className={styles.currentEmailValue}>{email}</span>
				</p>
				<ElevationPanel elevation={elevation} purpose="changing email" />
				{getAppMode() === "demo" ? (
					<Notice tone="info">
						Demo confirmation code is also{" "}
						<code className={styles.codeMono}>{DEMO_VERIFICATION_CODE}</code>
					</Notice>
				) : null}

				{!awaitingConfirm ? (
					<div className={styles.inlineForm}>
						<div className={styles.inlineFormField}>
							<FormField
								name="new-email"
								label="New email"
								type="email"
								value={newEmail}
								onChange={(event) => setNewEmail(event.target.value)}
							/>
						</div>
						<Button
							variant="primary"
							loading={sendMutation.isPending}
							disabled={!elevation.elevatedToken || !newEmail.trim()}
							onClick={() =>
								elevation.elevatedToken &&
								void sendMutation.mutate({
									input: {
										elevatedAccessToken: elevation.elevatedToken,
										newEmail: newEmail.trim(),
									},
								})
							}
						>
							Send code to new email
						</Button>
					</div>
				) : (
					<div className={styles.inlineForm}>
						<div className={styles.inlineFormField}>
							<FormField
								name="confirm-code"
								label="Code from new email"
								value={confirmCode}
								onChange={(event) => setConfirmCode(event.target.value)}
								inputMode="numeric"
							/>
						</div>
						<Button
							variant="primary"
							loading={confirmMutation.isPending}
							disabled={!elevation.elevatedToken}
							onClick={() =>
								elevation.elevatedToken &&
								void confirmMutation.mutate({
									input: {
										code: confirmCode.trim(),
										elevatedAccessToken: elevation.elevatedToken,
									},
								})
							}
						>
							Confirm email change
						</Button>
					</div>
				)}
				{error ? <ErrorText>{error}</ErrorText> : null}
			</CardBody>
		</Card>
	);
}
