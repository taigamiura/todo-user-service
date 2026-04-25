export type AppStatusCode = 400 | 404 | 409 | 422 | 503;
export type AppErrorCode =
	| "BAD_REQUEST"
	| "NOT_FOUND"
	| "CONFLICT"
	| "UNPROCESSABLE_ENTITY"
	| "SERVICE_UNAVAILABLE";

export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: AppStatusCode,
		public readonly code: AppErrorCode,
	) {
		super(message);
		this.name = new.target.name;
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad Request") {
		super(message, 400, "BAD_REQUEST");
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Not found") {
		super(message, 404, "NOT_FOUND");
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict") {
		super(message, 409, "CONFLICT");
	}
}

export class UnprocessableEntityError extends AppError {
	constructor(message = "Unprocessable Entity") {
		super(message, 422, "UNPROCESSABLE_ENTITY");
	}
}

export class ServiceUnavailableError extends AppError {
	constructor(message = "Service Unavailable") {
		super(message, 503, "SERVICE_UNAVAILABLE");
	}
}

export const isAppError = (error: unknown): error is AppError => {
	return error instanceof AppError;
};
