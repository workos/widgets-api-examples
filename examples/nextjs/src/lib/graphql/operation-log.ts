/**
 * A tiny external store of the GraphQL traffic this app produces.
 *
 * The dashboard surfaces it in an "API activity" panel so you can watch the exact
 * Client API operations each widget issues, which is the point of the example.
 */
export type LoggedOperation = {
	id: number;
	name: string;
	kind: "query" | "mutation";
	query: string;
	variables: Record<string, unknown>;
	startedAt: number;
	durationMs: number;
	status: "ok" | "error";
	errors?: string[];
	result?: unknown;
};

const MAX_ENTRIES = 50;

let entries: LoggedOperation[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
	for (const listener of listeners) listener();
}

export function recordOperation(entry: Omit<LoggedOperation, "id">): void {
	entries = [{ ...entry, id: nextId++ }, ...entries].slice(0, MAX_ENTRIES);
	emit();
}

export function clearOperations(): void {
	entries = [];
	emit();
}

export function subscribeToOperations(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getOperations(): LoggedOperation[] {
	return entries;
}

const EMPTY: LoggedOperation[] = [];

/** Server snapshot for `useSyncExternalStore`; the log only exists in the browser. */
export function getServerOperations(): LoggedOperation[] {
	return EMPTY;
}
