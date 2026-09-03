"use client";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { displayName } from "@/lib/format";
import type { AppUser } from "@/lib/workos/session";
import { signOutAction } from "@/lib/workos/auth-actions";
import { DropdownMenu } from "radix-ui";

interface UserMenuDropdownContextValue {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	user: AppUser;
}

const UserMenuDropdownContext = React.createContext<UserMenuDropdownContextValue | null>(null);
UserMenuDropdownContext.displayName = "UserMenuDropdownContext";

function useUserMenuDropdownContext(): UserMenuDropdownContextValue {
	const context = React.use(UserMenuDropdownContext);
	if (!context) {
		throw new Error("useUserMenuDropdownContext must be used within UserMenuDropdownContext");
	}
	return context;
}

export function UserMenuDropdown({
	user,
	children,
	...props
}: { user: AppUser } & Omit<DropdownMenu.DropdownMenuProps, "open" | "onOpenChange">) {
	const [open, setOpen] = React.useState(false);
	return (
		<DropdownMenu.Root open={open} onOpenChange={setOpen} {...props}>
			<UserMenuDropdownContext value={{ open, setOpen, user }}>{children}</UserMenuDropdownContext>
		</DropdownMenu.Root>
	);
}

export function UserMenuDropdownTrigger(
	props: Omit<DropdownMenu.DropdownMenuTriggerProps, "children">,
) {
	const { user } = useUserMenuDropdownContext();
	return (
		<DropdownMenu.Trigger {...props}>
			<span className="sr-only">Account menu</span>
			<Avatar
				aria-hidden
				size="sm"
				email={user.email}
				firstName={user.firstName}
				lastName={user.lastName}
				src={user.profilePictureUrl}
			/>
		</DropdownMenu.Trigger>
	);
}

export function UserMenuDropdownItem(
	props: Omit<DropdownMenu.DropdownMenuItemProps, "children" | "onSelect">,
) {
	const [pending, startTransition] = React.useTransition();
	return (
		<DropdownMenu.Item
			disabled={pending}
			onSelect={() => startTransition(() => signOutAction())}
			{...props}
		>
			{pending ? "Signing out…" : "Sign out"}
		</DropdownMenu.Item>
	);
}

export function UserMenuName(props: Omit<React.ComponentPropsWithoutRef<"p">, "children">) {
	const { user } = useUserMenuDropdownContext();
	return <p {...props}>{displayName(user)}</p>;
}

export function UserMenuEmail(props: Omit<React.ComponentPropsWithoutRef<"p">, "children">) {
	const { user } = useUserMenuDropdownContext();
	return <p {...props}>{user.email}</p>;
}

export function UserMenuDropdownContent(
	props: Omit<DropdownMenu.DropdownMenuContentProps, "sideOffset">,
) {
	return <DropdownMenu.Content sideOffset={5} {...props} />;
}
