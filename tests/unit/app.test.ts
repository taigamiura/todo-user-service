import { describe, expect, it } from "bun:test";
import { createApp } from "../../src/app";
import {
	ConflictError,
	NotFoundError,
	ServiceUnavailableError,
} from "../../src/errors";
import type {
	CreateUserInput,
	UpdateUserInput,
	User,
	UserService,
} from "../../src/users/types";

const sampleUser: User = {
	id: 1,
	username: "john_doe",
	email: "john@example.com",
};

const createMockUserService = (
	overrides: Partial<UserService> = {},
): UserService => ({
	listUsers: async () => [sampleUser],
	getUserById: async (id) => ({
		id,
		username: "mock_user",
		email: "mock@example.com",
	}),
	createUser: async (input: CreateUserInput) => ({
		id: 2,
		username: input.username,
		email: input.email,
	}),
	updateUser: async (id: number, input: UpdateUserInput) => ({
		id,
		username: input.username,
		email: input.email,
	}),
	deleteUser: async () => {},
	...overrides,
});

describe("User Service のユニットテスト", () => {
	it("GET / はルートエンドポイントのヘルスチェック文字列を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("Hello Hono!");
	});

	it("GET /users は 200 とユーザー一覧を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual([sampleUser]);
	});

	it("GET /users/:id はモックされたリポジトリデータで 200 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/123");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			id: 123,
			username: "mock_user",
			email: "mock@example.com",
		});
	});

	it("GET /users/:id は id が不正なとき 400 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/abc");
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ message: "User id must be a positive integer" });
	});

	it("GET /users/:id はリポジトリ側で未検出なら 404 を返す", async () => {
		const app = createApp(
			createMockUserService({
				getUserById: async () => {
					throw new NotFoundError("User not found");
				},
			}),
		);

		const res = await app.request("/users/999");
		const body = await res.json();

		expect(res.status).toBe(404);
		expect(body).toEqual({ message: "User not found" });
	});

	it("POST /users はペイロードが有効なとき 201 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "new_user",
				email: "new@example.com",
				password: "password123",
			}),
		});
		const body = await res.json();

		expect(res.status).toBe(201);
		expect(body).toEqual({
			id: 2,
			username: "new_user",
			email: "new@example.com",
		});
	});

	it("POST /users は不正なペイロードに 422 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "",
				email: "invalid-email",
				password: "short",
			}),
		});
		const body = await res.json();

		expect(res.status).toBe(422);
		expect(body).toEqual({ message: "username is required" });
	});

	it("POST /users は重複検知時に 409 を返す", async () => {
		const app = createApp(
			createMockUserService({
				createUser: async () => {
					throw new ConflictError("User already exists");
				},
			}),
		);

		const res = await app.request("/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "john_doe",
				email: "john@example.com",
				password: "password123",
			}),
		});
		const body = await res.json();

		expect(res.status).toBe(409);
		expect(body).toEqual({ message: "User already exists" });
	});

	it("PUT /users/:id はユーザーが存在するとき 200 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/3", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				username: "updated_user",
				email: "updated@example.com",
				password: "password123",
			}),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			id: 3,
			username: "updated_user",
			email: "updated@example.com",
		});
	});

	it("DELETE /users/:id はユーザーが存在するとき 204 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/3", {
			method: "DELETE",
		});

		expect(res.status).toBe(204);
	});

	it("GET /users はデータベース利用不可時に 503 を返す", async () => {
		const app = createApp(
			createMockUserService({
				listUsers: async () => {
					throw new ServiceUnavailableError("Database is unavailable");
				},
			}),
		);

		const res = await app.request("/users");
		const body = await res.json();

		expect(res.status).toBe(503);
		expect(body).toEqual({ message: "Database is unavailable" });
	});

	it("GET /error は 500 とエラーメッセージの JSON を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/error");
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({ message: "Internal Server Error" });
	});
});
