const REDACTED_VALUE = "[REDACTED]";

export const REQUEST_BODY_LOG_ALLOWLIST = [
	"username",
	"email",
	"password",
] as const;

export const REQUEST_BODY_MASK_LIST = [
	"password",
	"token",
	"secret",
	"authorization",
	"accessToken",
	"refreshToken",
] as const;

export const REQUEST_PARAMS_LOG_ALLOWLIST = ["id"] as const;

export const REQUEST_PARAMS_MASK_LIST = [
	"token",
	"secret",
	"authorization",
] as const;

export const REQUEST_QUERY_LOG_ALLOWLIST = [
	"include",
	"page",
	"limit",
] as const;

export const REQUEST_QUERY_MASK_LIST = [
	"token",
	"secret",
	"authorization",
	"accessToken",
	"refreshToken",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const pickAllowedFields = (
	value: Record<string, unknown>,
	allowlist: readonly string[],
) => {
	const pickedEntries = Object.entries(value).filter(([key]) =>
		allowlist.includes(key),
	);

	return Object.fromEntries(pickedEntries);
};

const maskSensitiveFields = (
	value: unknown,
	maskList: readonly string[],
): unknown => {
	if (Array.isArray(value)) {
		return value.map((item) => maskSensitiveFields(item, maskList));
	}

	if (!isRecord(value)) {
		return value;
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, nestedValue]) => {
			if (maskList.includes(key)) {
				return [key, REDACTED_VALUE];
			}

			return [key, maskSensitiveFields(nestedValue, maskList)];
		}),
	);
};

export const sanitizeRequestBodyForLogging = (value: unknown) => {
	if (!isRecord(value)) {
		return undefined;
	}

	const allowedBody = pickAllowedFields(value, REQUEST_BODY_LOG_ALLOWLIST);

	if (Object.keys(allowedBody).length === 0) {
		return undefined;
	}

	return maskSensitiveFields(allowedBody, REQUEST_BODY_MASK_LIST);
};

export const sanitizeParamsForLogging = (value: Record<string, string>) => {
	const allowedParams = pickAllowedFields(value, REQUEST_PARAMS_LOG_ALLOWLIST);

	if (Object.keys(allowedParams).length === 0) {
		return undefined;
	}

	return maskSensitiveFields(allowedParams, REQUEST_PARAMS_MASK_LIST);
};

export const sanitizeQueryForLogging = (value: Record<string, string>) => {
	const allowedQuery = pickAllowedFields(value, REQUEST_QUERY_LOG_ALLOWLIST);

	if (Object.keys(allowedQuery).length === 0) {
		return undefined;
	}

	return maskSensitiveFields(allowedQuery, REQUEST_QUERY_MASK_LIST);
};
