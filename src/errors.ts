export type AppStatusCode = 400 | 404 | 409 | 422 | 503;

export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: AppStatusCode,
	) {
		super(message);
		this.name = new.target.name;
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad Request") {
		super(message, 400);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Not found") {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict") {
		super(message, 409);
	}
}

export class UnprocessableEntityError extends AppError {
	constructor(message = "Unprocessable Entity") {
		super(message, 422);
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service Unavailable") {
		super(message, 503);
	}
}

export const isAppError = (error: unknown): error is AppError => {
	return error instanceof AppError;
};
