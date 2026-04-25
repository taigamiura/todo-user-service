import type postgres from "postgres";
import { ConflictError, ServiceUnavailableError } from "./errors";
import type {
	CreateUserInput,
	UpdateUserInput,
	User,
	UserRepository,
} from "./users/types";

type UserRow = {
	id: number;
	username: string;
	email: string;
};

const toUser = (user: UserRow): User => ({
	id: user.id,
	username: user.username,
	email: user.email,
});

const isDatabaseUnavailable = (error: unknown) => {
	return Boolean(
		error &&
			typeof error === "object" &&
			"code" in error &&
			typeof error.code === "string" &&
			error.code.startsWith("08"),
	);
};

const mapRepositoryError = (error: unknown): never => {
	if (
		error &&
		typeof error === "object" &&
		"code" in error &&
		error.code === "23505"
	) {
		throw new ConflictError("User already exists");
	}

	if (isDatabaseUnavailable(error)) {
		throw new ServiceUnavailableError("Database is unavailable");
	}

	throw error;
};

export const createUserRepository = (sql: postgres.Sql): UserRepository => {
	return {
		async listUsers(): Promise<User[]> {
			try {
				const users = await sql<UserRow[]>`
          select id, username, email
          from users
          order by id asc
        `;

				return users.map(toUser);
			} catch (error) {
				return mapRepositoryError(error);
			}
		},

		async findUserById(id: number): Promise<User | null> {
			try {
				const users = await sql<UserRow[]>`
          select id, username, email
          from users
          where id = ${id}
        `;

				return users[0] ? toUser(users[0]) : null;
			} catch (error) {
				return mapRepositoryError(error);
			}
		},

		async createUser(input: CreateUserInput): Promise<User> {
			try {
				const users = await sql<UserRow[]>`
          insert into users (username, email, password)
          values (${input.username}, ${input.email}, ${input.password})
          returning id, username, email
        `;

				return toUser(users[0]);
			} catch (error) {
				return mapRepositoryError(error);
			}
		},

		async updateUser(id: number, input: UpdateUserInput): Promise<User | null> {
			try {
				const users = await sql<UserRow[]>`
          update users
          set username = ${input.username},
              email = ${input.email},
              password = ${input.password},
              updated_at = current_timestamp
          where id = ${id}
          returning id, username, email
        `;

				return users[0] ? toUser(users[0]) : null;
			} catch (error) {
				return mapRepositoryError(error);
			}
		},

		async deleteUser(id: number): Promise<boolean> {
			try {
				const users = await sql<UserRow[]>`
          delete from users
          where id = ${id}
          returning id, username, email
        `;

				return users.length > 0;
			} catch (error) {
				return mapRepositoryError(error);
			}
		},
	};
};
