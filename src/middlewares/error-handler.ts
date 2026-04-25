import type { ErrorHandler } from "hono";
import { isAppError } from "../errors";
import type { AppEnv } from "../shared/app-env";
import { jsonError } from "../shared/http";
import {
	sanitizeParamsForLogging,
	sanitizeQueryForLogging,
} from "../shared/logging";

const getRequestMetadata = (c: {
	req: {
		path: string;
		routePath?: string;
		param: () => Record<string, string>;
		query: () => Record<string, string>;
	};
}) => {
	const routePattern = c.req.routePath || c.req.path;
	const params = c.req.param();
	const query = c.req.query();

	return {
		routePattern,
		params: sanitizeParamsForLogging(params),
		query: sanitizeQueryForLogging(query),
	};
};

const getRequestId = (c: { get: (key: "requestId") => string }) => {
	return c.get("requestId");
};

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
	const requestId = getRequestId(c);
	const { routePattern, params, query } = getRequestMetadata(c);

	if (isAppError(err)) {
		if (err.statusCode >= 500) {
			console.error(
				JSON.stringify({
					level: "error",
					timestamp: new Date().toISOString(),
					requestId,
					method: c.req.method,
					routePattern,
					params,
					query,
					status: err.statusCode,
					code: err.code,
					message: err.message,
				}),
			);
		}

		return jsonError(c, err.message, err.code, err.statusCode);
	}

	console.error(
		JSON.stringify({
			level: "error",
			timestamp: new Date().toISOString(),
			requestId,
			method: c.req.method,
			routePattern,
			params,
			query,
			status: 500,
			code: "INTERNAL_SERVER_ERROR",
			message: err instanceof Error ? err.message : "Unexpected error",
			stack: err instanceof Error ? err.stack : undefined,
		}),
	);

	return jsonError(c, "Internal Server Error", "INTERNAL_SERVER_ERROR", 500);
};
