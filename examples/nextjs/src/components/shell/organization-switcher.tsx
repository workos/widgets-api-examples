"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";

import { useGraphqlQuery as useQuery } from "@/lib/graphql/hooks";
import { ORGANIZATIONS_QUERY } from "@/lib/graphql/operations";
import type { OrganizationsQueryResult } from "@/lib/graphql/types";
import { switchOrganizationAction } from "@/lib/workos/auth-actions";
import { OrganizationLabel } from "./organization-label";

/**
 * Re-scopes the session token to another organization the signed-in user belongs
 * to. AuthKit picks the organization once, at sign in, so this is the only way
 * to change tenants without signing out.
 *
 * Falls back to the read-only label when there is nothing to choose between,
 * which covers demo mode as well as the single-tenant majority in live mode.
 */
export function OrganizationSwitcher() {
	const pathname = usePathname();
	const [pending, startTransition] = React.useTransition();
	const { data } = useQuery<OrganizationsQueryResult>(ORGANIZATIONS_QUERY);
	const organizations = data?.organizations ?? [];

	if (organizations.length < 2) {
		return <OrganizationLabel />;
	}

	const current = organizations.find((organization) => organization.isCurrent) ?? organizations[0];

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger className="OrganizationSwitcherTrigger" disabled={pending}>
				<span className="sr-only">Switch organization</span>
				<span className="truncate">{current.name}</span>
				<ChevronDownIcon aria-hidden height={12} width={12} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				className="OrganizationSwitcherContent"
				sideOffset={6}
				align="start"
				collisionPadding={8}
			>
				{organizations.map((organization) => (
					<DropdownMenu.Item
						key={organization.id}
						className="OrganizationSwitcherItem"
						disabled={pending || organization.id === current.id}
						onSelect={() =>
							startTransition(() => switchOrganizationAction(organization.id, pathname))
						}
					>
						<span className="truncate">{organization.name}</span>
						{organization.id === current.id ? (
							<CheckIcon aria-hidden height={14} width={14} />
						) : null}
					</DropdownMenu.Item>
				))}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	);
}
