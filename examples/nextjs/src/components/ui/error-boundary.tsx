// Modified from https://github.com/bvaughn/react-error-boundary
// Copyright (c) 2020 Brian Vaughn, MIT License

import * as React from "react";

type ErrorBoundaryState = { didCatch: true; error: any } | { didCatch: false; error: null };

export interface ErrorBoundaryContextValue {
	didCatch: boolean;
	error: any;
	resetErrorBoundary: (...args: any[]) => void;
}

const ErrorBoundaryContext = React.createContext<ErrorBoundaryContextValue | null>(null);
ErrorBoundaryContext.displayName = "ErrorBoundaryContext";

const initialState: ErrorBoundaryState = {
	didCatch: false,
	error: null,
} satisfies ErrorBoundaryState;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);

		this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
		this.state = initialState;
	}

	static getDerivedStateFromError(error: Error) {
		return { didCatch: true, error };
	}

	resetErrorBoundary(...args: any[]) {
		const { error } = this.state;

		if (error !== null) {
			this.props.onReset?.({
				args,
				reason: "imperative-api",
			});

			this.setState(initialState);
		}
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		this.props.onError?.(error, info);
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
		const { didCatch } = this.state;
		const { resetKeys } = this.props;

		// There's an edge case where if the thing that triggered the error happens
		// to *also* be in the resetKeys array, we'd end up resetting the error
		// boundary immediately.
		//
		// This would likely trigger a second error to be thrown. So we make sure
		// that we don't check the resetKeys on the first call of cDU after the
		// error is set.
		if (didCatch && prevState.error !== null && hasArrayChanged(prevProps.resetKeys, resetKeys)) {
			this.props.onReset?.({
				next: resetKeys,
				prev: prevProps.resetKeys,
				reason: "keys",
			});

			// oxlint-disable-next-line react/no-did-update-set-state
			this.setState(initialState);
		}
	}

	render() {
		const { children, fallbackRender, FallbackComponent, fallback } = this.props;
		const { didCatch, error } = this.state;

		let childToRender = children;

		if (didCatch) {
			const props: FallbackProps = {
				error,
				resetErrorBoundary: this.resetErrorBoundary,
			};

			if (typeof fallbackRender === "function") {
				childToRender = fallbackRender(props);
			} else if (FallbackComponent) {
				childToRender = React.createElement(FallbackComponent, props);
			} else if (fallback !== undefined) {
				childToRender = fallback;
			} else {
				throw error;
			}
		}

		return (
			<ErrorBoundaryContext
				value={{
					didCatch,
					error,
					resetErrorBoundary: this.resetErrorBoundary,
				}}
			>
				{childToRender}
			</ErrorBoundaryContext>
		);
	}
}

function hasArrayChanged(a: any[] = [], b: any[] = []) {
	return a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]));
}

export type FallbackProps = {
	error: any;
	resetErrorBoundary: (...args: any[]) => void;
};

type ErrorBoundarySharedProps = React.PropsWithChildren<{
	onError?: (error: Error, info: React.ErrorInfo) => void;
	onReset?: (
		details:
			| { reason: "imperative-api"; args: any[] }
			| { reason: "keys"; prev: any[] | undefined; next: any[] | undefined },
	) => void;
	resetKeys?: any[];
}>;

export type ErrorBoundaryPropsWithComponent = ErrorBoundarySharedProps & {
	fallback?: never;
	FallbackComponent: React.ComponentType<FallbackProps>;
	fallbackRender?: never;
};

export type ErrorBoundaryPropsWithRender = ErrorBoundarySharedProps & {
	fallback?: never;
	FallbackComponent?: never;
	fallbackRender: (props: FallbackProps) => React.ReactNode;
};

export type ErrorBoundaryPropsWithFallback = ErrorBoundarySharedProps & {
	fallback: React.ReactNode;
	FallbackComponent?: never;
	fallbackRender?: never;
};

export type ErrorBoundaryProps =
	| ErrorBoundaryPropsWithFallback
	| ErrorBoundaryPropsWithComponent
	| ErrorBoundaryPropsWithRender;
