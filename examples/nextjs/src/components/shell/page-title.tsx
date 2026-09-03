"use client";
import { usePathname } from "next/navigation";
import { findNavItem } from "./nav";

export function PageTitle({ ...props }: Omit<React.ComponentPropsWithoutRef<"h1">, "children">) {
	const pathname = usePathname();
	const active = findNavItem(pathname);
	return <h1 {...props}>{active?.label ?? "Dashboard"}</h1>;
}
