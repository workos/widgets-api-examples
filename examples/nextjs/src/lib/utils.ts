export function isErrorLike(error: unknown): error is Error {
	return (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string" &&
		"name" in error &&
		typeof error.name === "string"
	);
}

export function getErrorMessage(error: unknown) {
	return isErrorLike(error) ? error.message : null;
}
