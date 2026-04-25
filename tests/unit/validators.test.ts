import { describe, expect, it } from "bun:test";
import { BadRequestError, UnprocessableEntityError } from "../../src/errors";
import {
	normalizeUserInput,
	parseJsonBody,
	parseUserId,
} from "../../src/users/validators";

describe("users validators のユニットテスト", () => {
	it("parseUserId は有効なパスパラメータから数値 id を返す", () => {
		expect(parseUserId("42")).toBe(42);
	});

	it("parseUserId は URL パスの非数値ユーザー id を拒否する", () => {
		expect(() => parseUserId("abc")).toThrow(BadRequestError);
		expect(() => parseUserId("abc")).toThrow(
			"User id must be a positive integer",
		);
	});

	it("parseUserId は 0 と負の id を拒否する", () => {
		expect(() => parseUserId("0")).toThrow(BadRequestError);
		expect(() => parseUserId("-1")).toThrow(BadRequestError);
	});

	it("normalizeUserInput は有効なペイロードで username を trim し email を小文字化する", () => {
		expect(
			normalizeUserInput({
				username: "  new_user  ",
				email: "  NEW@EXAMPLE.COM  ",
				password: "password123",
			}),
		).toEqual({
			username: "new_user",
			email: "new@example.com",
			password: "password123",
		});
	});

	it("normalizeUserInput はオブジェクトでないリクエストボディを拒否する", () => {
		expect(() => normalizeUserInput(null)).toThrow(UnprocessableEntityError);
		expect(() => normalizeUserInput("raw text body")).toThrow(
			"Request body must be a JSON object",
		);
	});

	it("normalizeUserInput は username 欠落を拒否する", () => {
		expect(() =>
			normalizeUserInput({
				username: "   ",
				email: "user@example.com",
				password: "password123",
			}),
		).toThrow("username is required");
	});

	it("normalizeUserInput は不正な email 形式を拒否する", () => {
		expect(() =>
			normalizeUserInput({
				username: "new_user",
				email: "not-an-email",
				password: "password123",
			}),
		).toThrow(UnprocessableEntityError);
		expect(() =>
			normalizeUserInput({
				username: "new_user",
				email: "not-an-email",
				password: "password123",
			}),
		).toThrow("email must be valid");
	});

	it("normalizeUserInput は最小ポリシー未満の短い password を拒否する", () => {
		expect(() =>
			normalizeUserInput({
				username: "new_user",
				email: "user@example.com",
				password: "short",
			}),
		).toThrow(UnprocessableEntityError);
		expect(() =>
			normalizeUserInput({
				username: "new_user",
				email: "user@example.com",
				password: "short",
			}),
		).toThrow("password must be at least 8 characters");
	});

	it("parseJsonBody は有効なリクエストボディから JSON を返す", async () => {
		const request = new Request("http://localhost/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: "new_user" }),
		});

		expect(parseJsonBody(request)).resolves.toEqual({
			username: "new_user",
		});
	});

	it("parseJsonBody は不正な JSON をサービス層に到達する前に拒否する", async () => {
		const request = new Request("http://localhost/users", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: '{"username":',
		});

		expect(parseJsonBody(request)).rejects.toThrow(BadRequestError);
		expect(parseJsonBody(request.clone())).rejects.toThrow(
			"Request body must be valid JSON",
		);
	});
});
