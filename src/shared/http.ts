import type { Context } from "hono";
import type { AppStatusCode } from "../errors";

type SuccessStatusCode = 200 | 201;

export type ApiSuccessResponse<T> = {
	success: true;
	data: T;
};

export type ApiErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
	};
};

export const jsonSuccess = <T>(
	c: Context,
	data: T,
	status: SuccessStatusCode = 200,
) => {
	return c.json<ApiSuccessResponse<T>>({ success: true, data }, status);
};

export const jsonError = (
	c: Context,
	message: string,
	code: string,
	status: AppStatusCode | 500,
) => {
	return c.json<ApiErrorResponse>(
		{
			success: false,
			error: {
				code,
				message,
			},
		},
		status,
	);
};
