import { Hono } from "hono";
import { errorHandler, requestLogger } from "./middlewares";
import type { AppEnv } from "./shared/app-env";
import { jsonSuccess } from "./shared/http";
import type { UserService } from "./users/types";
import { createUserRoutes } from "./users/user-routes";

export const createApp = (userService: UserService) => {
	const app = new Hono<AppEnv>();

	app.use("*", requestLogger);

	app.get("/health", (c) => {
		return jsonSuccess(c, {
			status: "ok",
		});
	});

	app.route("/users", createUserRoutes(userService));

	app.onError(errorHandler);

	return app;
};
