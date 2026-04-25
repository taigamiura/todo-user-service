import { describe, expect, it } from "bun:test";
import { NotFoundError } from "../../src/errors";
import type {
	CreateUserInput,
	UpdateUserInput,
	User,
	UserRepository,
} from "../../src/users/types";
import { createUserService } from "../../src/users/user-service";

const sampleUser: User = {
	id: 1,
	username: "john_doe",
	email: "john@example.com",
};

const createMockUserRepository = (
	overrides: Partial<UserRepository> = {},
): UserRepository => ({
	listUsers: async () => [sampleUser],
	findUserById: async (id) => ({ ...sampleUser, id }),
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
	deleteUser: async () => true,
	...overrides,
});

describe("user-service のユニットテスト", () => {
	it("listUsers は通常の一覧取得でリポジトリ結果を返す", () => {
		const service = createUserService(createMockUserRepository());

		expect(service.listUsers()).resolves.toEqual([sampleUser]);
	});

	it("getUserById は存在するユーザーを返す", () => {
		const service = createUserService(createMockUserRepository());

		expect(service.getUserById(10)).resolves.toEqual({
			id: 10,
			username: "john_doe",
			email: "john@example.com",
		});
	});

	it("getUserById は削除済みまたは未知のユーザーに not found を投げる", () => {
		const service = createUserService(
			createMockUserRepository({
				findUserById: async () => null,
			}),
		);

		expect(service.getUserById(999)).rejects.toThrow(NotFoundError);
		expect(service.getUserById(999)).rejects.toThrow("User not found");
	});

	it("createUser はユーザー作成をリポジトリに委譲する", () => {
		const service = createUserService(createMockUserRepository());

		expect(
			service.createUser({
				username: "new_user",
				email: "new@example.com",
				password: "password123",
			}),
		).resolves.toEqual({
			id: 2,
			username: "new_user",
			email: "new@example.com",
		});
	});

	it("updateUser は対象レコードが存在するとき更新後のユーザーを返す", () => {
		const service = createUserService(createMockUserRepository());

		expect(
			service.updateUser(5, {
				username: "updated_user",
				email: "updated@example.com",
				password: "password456",
			}),
		).resolves.toEqual({
			id: 5,
			username: "updated_user",
			email: "updated@example.com",
		});
	});

	it("updateUser は存在しないユーザー更新時に not found を投げる", () => {
		const service = createUserService(
			createMockUserRepository({
				updateUser: async () => null,
			}),
		);

		expect(
			service.updateUser(404, {
				username: "missing_user",
				email: "missing@example.com",
				password: "password456",
			}),
		).rejects.toThrow(NotFoundError);
	});

	it("deleteUser はリポジトリで削除できたとき正常終了する", () => {
		const service = createUserService(createMockUserRepository());

		expect(service.deleteUser(7)).resolves.toBeUndefined();
	});

	it("deleteUser は既に削除済みのユーザーに not found を投げる", () => {
		const service = createUserService(
			createMockUserRepository({
				deleteUser: async () => false,
			}),
		);

		expect(service.deleteUser(404)).rejects.toThrow(NotFoundError);
		expect(service.deleteUser(404)).rejects.toThrow("User not found");
	});
});
