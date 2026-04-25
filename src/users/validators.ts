import { BadRequestError, UnprocessableEntityError } from "../errors";
import type { CreateUserInput } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const parseUserId = (value: string) => {
	const id = Number(value);

	if (!Number.isInteger(id) || id <= 0) {
		throw new BadRequestError("User id must be a positive integer");
	}

	return id;
};

export const normalizeUserInput = (value: unknown): CreateUserInput => {
	if (!value || typeof value !== "object") {
		throw new UnprocessableEntityError("Request body must be a JSON object");
	}

	const { username, email, password } = value as Record<string, unknown>;

	if (typeof username !== "string" || username.trim().length === 0) {
		throw new UnprocessableEntityError("username is required");
	}

	if (typeof email !== "string" || !emailPattern.test(email.trim())) {
		throw new UnprocessableEntityError("email must be valid");
	}

	if (typeof password !== "string" || password.trim().length < 8) {
		throw new UnprocessableEntityError(
			"password must be at least 8 characters",
		);
	}

	return {
		username: username.trim(),
		email: email.trim().toLowerCase(),
		password,
	};
};

export const parseJsonBody = async (request: Request) => {
	try {
		return await request.json();
	} catch {
		throw new BadRequestError("Request body must be valid JSON");
	}
};
