import * as React from "react";

export function useResetDialogKey(open: boolean) {
	const [key, setKey] = React.useState<string>();
	const [wasOpen, setWasOpen] = React.useState(open);
	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setKey(() => Math.random().toString());
		}
	}
	return key?.toString();
}
