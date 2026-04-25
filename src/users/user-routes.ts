import { Hono } from "hono";
import type { AppEnv } from "../shared/app-env";
import { jsonSuccess } from "../shared/http";
import type { UserService } from "./types";
import { normalizeUserInput, parseJsonBody, parseUserId } from "./validators";

export const createUserRoutes = (userService: UserService) => {
	const userRoutes = new Hono<AppEnv>();

	userRoutes.get("/", async (c) => {
		const users = await userService.listUsers();
		return jsonSuccess(c, users);
	});

	userRoutes.get("/:id", async (c) => {
		const id = parseUserId(c.req.param("id"));
		const user = await userService.getUserById(id);

		return jsonSuccess(c, user);
	});

	userRoutes.post("/", async (c) => {
		const payload = await parseJsonBody(c.req.raw);
		const user = await userService.createUser(normalizeUserInput(payload));

		return jsonSuccess(c, user, 201);
	});

	userRoutes.put("/:id", async (c) => {
		const id = parseUserId(c.req.param("id"));
		const payload = await parseJsonBody(c.req.raw);
		const user = await userService.updateUser(id, normalizeUserInput(payload));

		return jsonSuccess(c, user);
	});

	userRoutes.delete("/:id", async (c) => {
		const id = parseUserId(c.req.param("id"));
		await userService.deleteUser(id);

		return jsonSuccess(c, { deleted: true });
	});

	return userRoutes;
};
