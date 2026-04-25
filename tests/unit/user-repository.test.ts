import { describe, expect, it } from "bun:test";
import type postgres from "postgres";
import { ConflictError, ServiceUnavailableError } from "../../src/errors";
import { createUserRepository } from "../../src/user-repository";

type QueryHandlerResult = unknown[];

const createSqlMock = (
	handler: (query: string, values: unknown[]) => Promise<QueryHandlerResult>,
) => {
	const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
		const query = strings.join("__value__");
		return handler(query, values);
	};

	return sql as unknown as postgres.Sql;
};

describe("user-repository のユニットテスト", () => {
	it("listUsers は整形済みのユーザー一覧を返す", () => {
		const repository = createUserRepository(
			createSqlMock(async () => [
				{ id: 1, username: "john_doe", email: "john@example.com" },
				{ id: 2, username: "jane_smith", email: "jane@example.com" },
			]),
		);

		expect(repository.listUsers()).resolves.toEqual([
			{ id: 1, username: "john_doe", email: "john@example.com" },
			{ id: 2, username: "jane_smith", email: "jane@example.com" },
		]);
	});

	it("listUsers はデータベース接続が使えないとき 503 を投げる", () => {
		const repository = createUserRepository(
			createSqlMock(async () => {
				throw { code: "08006" };
			}),
		);

		expect(repository.listUsers()).rejects.toThrow(ServiceUnavailableError);
		expect(repository.listUsers()).rejects.toThrow("Database is unavailable");
	});

	it("findUserById は整形済みのユーザーを返す", () => {
		const repository = createUserRepository(
			createSqlMock(async (query, values) => {
				expect(query).toContain("where id =");
				expect(values).toEqual([1]);

				return [{ id: 1, username: "john_doe", email: "john@example.com" }];
			}),
		);

		expect(repository.findUserById(1)).resolves.toEqual({
			id: 1,
			username: "john_doe",
			email: "john@example.com",
		});
	});

	it("findUserById は対象ユーザーがいなければ null を返す", () => {
		const repository = createUserRepository(createSqlMock(async () => []));

		expect(repository.findUserById(999)).resolves.toBeNull();
	});

	it("findUserById は想定外のデータベースエラーを再送出する", () => {
		const repository = createUserRepository(
			createSqlMock(async () => {
				throw new Error("Unexpected database failure");
			}),
		);

		expect(repository.findUserById(1)).rejects.toThrow(
			"Unexpected database failure",
		);
	});

	it("createUser は作成したユーザーを返す", () => {
		const repository = createUserRepository(
			createSqlMock(async (query, values) => {
				expect(query).toContain("insert into users");
				expect(values).toEqual(["new_user", "new@example.com", "password123"]);

				return [{ id: 3, username: "new_user", email: "new@example.com" }];
			}),
		);

		expect(
			repository.createUser({
				username: "new_user",
				email: "new@example.com",
				password: "password123",
			}),
		).resolves.toEqual({
			id: 3,
			username: "new_user",
			email: "new@example.com",
		});
	});

	it("createUser は username か email の重複時に 409 を投げる", () => {
		const repository = createUserRepository(
			createSqlMock(async () => {
				throw { code: "23505" };
			}),
		);

		expect(
			repository.createUser({
				username: "john_doe",
				email: "john@example.com",
				password: "password123",
			}),
		).rejects.toThrow(ConflictError);
	});

	it("updateUser は更新後のユーザーを返す", () => {
		const repository = createUserRepository(
			createSqlMock(async (query, values) => {
				expect(query).toContain("update users");
				expect(values).toEqual([
					"updated_user",
					"updated@example.com",
					"password456",
					4,
				]);

				return [
					{ id: 4, username: "updated_user", email: "updated@example.com" },
				];
			}),
		);

		expect(
			repository.updateUser(4, {
				username: "updated_user",
				email: "updated@example.com",
				password: "password456",
			}),
		).resolves.toEqual({
			id: 4,
			username: "updated_user",
			email: "updated@example.com",
		});
	});

	it("updateUser は対象ユーザーが存在しなければ null を返す", () => {
		const repository = createUserRepository(createSqlMock(async () => []));

		expect(
			repository.updateUser(404, {
				username: "missing_user",
				email: "missing@example.com",
				password: "password123",
			}),
		).resolves.toBeNull();
	});

	it("updateUser はデータベースが利用不可になったとき 503 を投げる", () => {
		const repository = createUserRepository(
			createSqlMock(async () => {
				throw { code: "08001" };
			}),
		);

		expect(
			repository.updateUser(4, {
				username: "updated_user",
				email: "updated@example.com",
				password: "password456",
			}),
		).rejects.toThrow(ServiceUnavailableError);
	});

	it("deleteUser は行を削除できたとき true を返す", () => {
		const repository = createUserRepository(
			createSqlMock(async (query, values) => {
				expect(query).toContain("delete from users");
				expect(values).toEqual([7]);

				return [{ id: 7, username: "to_delete", email: "delete@example.com" }];
			}),
		);

		expect(repository.deleteUser(7)).resolves.toBe(true);
	});

	it("deleteUser は削除対象がなければ false を返す", () => {
		const repository = createUserRepository(createSqlMock(async () => []));

		expect(repository.deleteUser(999)).resolves.toBe(false);
	});

	it("deleteUser はデータベース利用不可時に 503 を投げる", () => {
		const repository = createUserRepository(
			createSqlMock(async () => {
				throw { code: "08003" };
			}),
		);

		expect(repository.deleteUser(8)).rejects.toThrow(ServiceUnavailableError);
	});
});
