import { CodeBlock } from "@/components/ui/code-block";
import { Notice } from "@/components/ui/feedback";

/**
 * Shown when live mode is configured but a Client API token cannot be minted —
 * usually a missing organization or the Widgets API beta not being enabled.
 */
export function SetupRequired({
	reason,
	message,
}: {
	reason: "unauthenticated" | "no-organization" | "request-failed";
	message: string;
}) {
	return (
		<div className="SetupRequired">
			<div>
				<p className="SetupRequiredEyebrow">WorkOS Widgets API example</p>
				<h1 className="SetupRequiredTitle">One more step before the dashboard loads</h1>
				<p className="SetupRequiredLede">
					The app could not exchange your AuthKit session for a Client API token.
				</p>
			</div>

			<Notice tone="critical" title="What the API returned">
				<p className="SetupRequiredMessage">{message}</p>
			</Notice>

			{reason === "no-organization" ? (
				<section className="SetupRequiredSection">
					<p className="SetupRequiredSectionTitle">How to fix it</p>
					<ol className="SetupRequiredOrderedList">
						<li>Create an organization in the WorkOS dashboard.</li>
						<li>Add your user to it as a member.</li>
						<li>Sign out and sign back in so the session is scoped to that org.</li>
					</ol>
				</section>
			) : null}

			{reason === "request-failed" ? (
				<section className="SetupRequiredSection">
					<p className="SetupRequiredSectionTitle">Common causes</p>
					<ul className="SetupRequiredUnorderedList">
						<li>
							The Widgets API is a closed beta. Contact WorkOS to enable it for your environment.
						</li>
						<li>
							<code className="SetupRequiredCode">WORKOS_API_KEY</code> belongs to a different
							environment than the organization.
						</li>
					</ul>
					<p className="SetupRequiredDemoHint">
						To explore the dashboard without credentials, force demo mode:
					</p>
					<CodeBlock code={"WIDGETS_DEMO_MODE=1 pnpm dev"} maxHeight="5rem" />
				</section>
			) : null}
		</div>
	);
}
