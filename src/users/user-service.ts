import { NotFoundError } from "../errors";
import type {
	CreateUserInput,
	UpdateUserInput,
	UserRepository,
	UserService,
} from "./types";

export const createUserService = (
	userRepository: UserRepository,
): UserService => {
	return {
		listUsers() {
			return userRepository.listUsers();
		},

		async getUserById(id: number) {
			const user = await userRepository.findUserById(id);

			if (!user) {
				throw new NotFoundError("User not found");
			}

			return user;
		},

		createUser(input: CreateUserInput) {
			return userRepository.createUser(input);
		},

		async updateUser(id: number, input: UpdateUserInput) {
			const user = await userRepository.updateUser(id, input);

			if (!user) {
				throw new NotFoundError("User not found");
			}

			return user;
		},

		async deleteUser(id: number) {
			const deleted = await userRepository.deleteUser(id);

			if (!deleted) {
				throw new NotFoundError("User not found");
			}
		},
	};
};
