import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../shared/app-env";
import {
	sanitizeParamsForLogging,
	sanitizeQueryForLogging,
	sanitizeRequestBodyForLogging,
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

export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
	const requestId = c.req.header("x-request-id")?.trim() || crypto.randomUUID();
	const startedAt = performance.now();
	const clonedRequest = shouldCaptureRequestBody(c)
		? c.req.raw.clone()
		: undefined;

	c.set("requestId", requestId);

	await next();

	c.res.headers.set("x-request-id", requestId);

	const { routePattern, params, query } = getRequestMetadata(c);
	const requestBody = await getLoggedRequestBody(clonedRequest);

	console.log(
		JSON.stringify({
			level: "info",
			timestamp: new Date().toISOString(),
			requestId,
			method: c.req.method,
			routePattern,
			params,
			query,
			requestBody,
			status: c.res.status,
			durationMs: Number((performance.now() - startedAt).toFixed(2)),
		}),
	);
};

const isJsonRequest = (contentType: string | undefined) => {
	if (!contentType) {
		return false;
	}

	const normalizedContentType = contentType.toLowerCase();

	return (
		normalizedContentType.includes("application/json") ||
		normalizedContentType.includes("+json")
	);
};

const shouldCaptureRequestBody = (c: {
	req: {
		method: string;
		header: (name: string) => string | undefined;
	};
}) => {
	if (["GET", "HEAD", "DELETE"].includes(c.req.method)) {
		return false;
	}

	if (!isJsonRequest(c.req.header("content-type"))) {
		return false;
	}

	return true;
};

const getLoggedRequestBody = async (clonedRequest?: Request) => {
	if (!clonedRequest) {
		return undefined;
	}

	try {
		const body = await clonedRequest.json();

		return sanitizeRequestBodyForLogging(body);
	} catch {
		return undefined;
	}
};
