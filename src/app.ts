import { Hono } from "hono";
import { errorHandler, requestLogger } from "./middlewares";
import type { UserService } from "./users/types";
import { createUserRoutes } from "./users/user-routes";

export const createApp = (userService: UserService) => {
	const app = new Hono();

	app.use("*", requestLogger);

	app.get("/", (c) => {
		return c.text("Hello Hono!");
	});

	app.get("/error", () => {
		throw new Error("onError demo");
	});

	app.route("/users", createUserRoutes(userService));

	app.onError(errorHandler);

	return app;
};
