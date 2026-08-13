/**
 * Lightweight tagged-template helper. Interpolated values (typically fragment
 * documents) are concatenated as text, which is valid GraphQL when those values
 * are themselves fragment definitions.
 */
export function gql(
	strings: TemplateStringsArray,
	...values: Array<string | number | boolean>
): string {
	let result = strings[0] ?? "";
	for (let index = 0; index < values.length; index += 1) {
		result += String(values[index]) + (strings[index + 1] ?? "");
	}
	return result.trim();
}

export function getOperationName(document: string): string {
	const match = /\b(?:query|mutation)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(document);
	return match?.[1] ?? "(anonymous)";
}

export function getOperationKind(document: string): "query" | "mutation" {
	return /^\s*mutation\b/m.test(document) ? "mutation" : "query";
}
