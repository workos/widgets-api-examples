import clsx from "clsx";

const PALETTE_COUNT = 6;

function getInitials(firstName?: string | null, lastName?: string | null, email?: string) {
	const first = firstName?.trim()?.[0];
	const last = lastName?.trim()?.[0];
	if (first && last) {
		return `${first}${last}`.toUpperCase();
	}
	if (first) {
		return first.toUpperCase();
	}
	return (email?.trim()?.[0] ?? "?").toUpperCase();
}

function getDisplayName(firstName?: string | null, lastName?: string | null, email?: string) {
	if (firstName && lastName) {
		return `${firstName} ${lastName}`;
	}
	if (firstName) {
		return firstName;
	}
	return email?.trim() ?? "";
}

function paletteIndex(seed: string) {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) {
		hash = (hash * 31 + seed.charCodeAt(index)) % 997;
	}
	return hash % PALETTE_COUNT;
}

export function Avatar({
	firstName,
	lastName,
	email,
	src,
	size = "md",
	className,
	...props
}: {
	firstName?: string | null;
	lastName?: string | null;
	email: string;
	src?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
	"aria-hidden"?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
	ref?: React.Ref<HTMLSpanElement>;
}) {
	const ariaLabel = (() => {
		if (props["aria-label"]) {
			return props["aria-label"];
		}
		if (props["aria-labelledby"] || props["aria-hidden"]) {
			return undefined;
		}
		return getDisplayName(firstName, lastName, email);
	})();

	return (
		<span
			className={clsx("ui-Avatar", className)}
			// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
			role="img"
			aria-label={ariaLabel}
			{...props}
			data-ui-component="avatar"
			data-ui-avatar-palette={paletteIndex(email)}
			data-ui-avatar-size={size}
		>
			{src ? (
				<img src={src} alt="" aria-hidden className={clsx("ui-AvatarImage", className)} />
			) : (
				getInitials(firstName, lastName, email)
			)}
		</span>
	);
}
