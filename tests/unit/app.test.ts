import { afterEach, describe, expect, it, mock, spyOn } from "bun:test";
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

afterEach(() => {
	mock.restore();
});

describe("User Service のユニットテスト", () => {
	it("GET /health は healthcheck を共通レスポンス形式で返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/health");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			success: true,
			data: {
				status: "ok",
			},
		});
	});

	it("GET /users は 200 とユーザー一覧を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			success: true,
			data: [sampleUser],
		});
	});

	it("GET /users/:id はモックされたリポジトリデータで 200 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/123");
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			success: true,
			data: {
				id: 123,
				username: "mock_user",
				email: "mock@example.com",
			},
		});
	});

	it("GET /users/:id は id が不正なとき 400 を返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/abc");
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({
			success: false,
			error: {
				code: "BAD_REQUEST",
				message: "User id must be a positive integer",
			},
		});
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
		expect(body).toEqual({
			success: false,
			error: {
				code: "NOT_FOUND",
				message: "User not found",
			},
		});
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
			success: true,
			data: {
				id: 2,
				username: "new_user",
				email: "new@example.com",
			},
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
		expect(body).toEqual({
			success: false,
			error: {
				code: "UNPROCESSABLE_ENTITY",
				message: "username is required",
			},
		});
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
		expect(body).toEqual({
			success: false,
			error: {
				code: "CONFLICT",
				message: "User already exists",
			},
		});
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
			success: true,
			data: {
				id: 3,
				username: "updated_user",
				email: "updated@example.com",
			},
		});
	});

	it("DELETE /users/:id はユーザーが存在するとき共通レスポンス形式で返す", async () => {
		const app = createApp(createMockUserService());

		const res = await app.request("/users/3", {
			method: "DELETE",
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({
			success: true,
			data: { deleted: true },
		});
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
		expect(body).toEqual({
			success: false,
			error: {
				code: "SERVICE_UNAVAILABLE",
				message: "Database is unavailable",
			},
		});
	});

	it("リクエスト完了時に route pattern とリクエスト値を含む構造化ログを出力する", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const app = createApp(createMockUserService());

		await app.request("/users/123?include=profile", {
			headers: {
				"x-request-id": "req-user-001",
			},
		});

		expect(logSpy).toHaveBeenCalledTimes(1);

		const [rawLog] = logSpy.mock.calls[0] as [string];
		const parsedLog = JSON.parse(rawLog);

		expect(parsedLog.level).toBe("info");
		expect(parsedLog.requestId).toBe("req-user-001");
		expect(parsedLog.method).toBe("GET");
		expect(parsedLog.path).toBeUndefined();
		expect(parsedLog.routePattern).toBe("/users/:id");
		expect(parsedLog.params).toEqual({ id: "123" });
		expect(parsedLog.query).toEqual({ include: "profile" });
		expect(parsedLog.requestBody).toBeUndefined();
		expect(parsedLog.status).toBe(200);
		expect(typeof parsedLog.durationMs).toBe("number");
	});

	it("params と query は許可リスト外を落としてログに出力する", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const app = createApp(createMockUserService());

		await app.request("/users/123?include=profile&token=secret-token", {
			headers: {
				"x-request-id": "req-user-002",
			},
		});

		expect(logSpy).toHaveBeenCalledTimes(1);

		const [rawLog] = logSpy.mock.calls[0] as [string];
		const parsedLog = JSON.parse(rawLog);

		expect(parsedLog.routePattern).toBe("/users/:id");
		expect(parsedLog.params).toEqual({ id: "123" });
		expect(parsedLog.query).toEqual({ include: "profile" });
	});

	it("JSON リクエストの body は許可リストに絞ってマスク付きでログに出力する", async () => {
		const logSpy = spyOn(console, "log").mockImplementation(() => {});
		const app = createApp(createMockUserService());

		await app.request("/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-request-id": "req-user-create-001",
			},
			body: JSON.stringify({
				username: "new_user",
				email: "new@example.com",
				password: "password123",
				ignored: "do-not-log",
			}),
		});

		expect(logSpy).toHaveBeenCalledTimes(1);

		const [rawLog] = logSpy.mock.calls[0] as [string];
		const parsedLog = JSON.parse(rawLog);

		expect(parsedLog.requestId).toBe("req-user-create-001");
		expect(parsedLog.routePattern).toBe("/users");
		expect(parsedLog.requestBody).toEqual({
			username: "new_user",
			email: "new@example.com",
			password: "[REDACTED]",
		});
		expect(parsedLog.requestBody.ignored).toBeUndefined();
	});
});
