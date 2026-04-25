import type { MiddlewareHandler } from "hono";

export const requestLogger: MiddlewareHandler = async (c, next) => {
	console.log(`${c.req.method} ${c.req.path}`);
	await next();
};
