import type { ErrorHandler } from "hono";
import { isAppError } from "../errors";

export const errorHandler: ErrorHandler = (err, c) => {
	console.error(err);

	if (isAppError(err)) {
		return c.json({ message: err.message }, { status: err.statusCode });
	}

	return c.json({ message: "Internal Server Error" }, 500);
};
