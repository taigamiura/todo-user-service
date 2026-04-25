export type User = {
	id: number;
	username: string;
	email: string;
};

export type CreateUserInput = {
	username: string;
	email: string;
	password: string;
};

export type UpdateUserInput = CreateUserInput;

export type UserRepository = {
	listUsers: () => Promise<User[]>;
	findUserById: (id: number) => Promise<User | null>;
	createUser: (input: CreateUserInput) => Promise<User>;
	updateUser: (id: number, input: UpdateUserInput) => Promise<User | null>;
	deleteUser: (id: number) => Promise<boolean>;
};

export type UserService = {
	listUsers: () => Promise<User[]>;
	getUserById: (id: number) => Promise<User>;
	createUser: (input: CreateUserInput) => Promise<User>;
	updateUser: (id: number, input: UpdateUserInput) => Promise<User>;
	deleteUser: (id: number) => Promise<void>;
};
