import { afterEach, describe, expect, it } from "bun:test";

const originalDatabaseUrl = process.env.DATABASE_URL;

const importDbModule = async () => {
	return import(`../../src/db.ts?test=${Date.now()}-${Math.random()}`);
};

afterEach(() => {
	if (originalDatabaseUrl === undefined) {
		delete process.env.DATABASE_URL;
		return;
	}

	process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("db のユニットテスト", () => {
	it("getDatabaseUrl は環境変数 DATABASE_URL が未設定なら例外を投げる", async () => {
		const { getDatabaseUrl } = await importDbModule();

		delete process.env.DATABASE_URL;

		try {
			getDatabaseUrl();
			throw new Error(
				"Expected getDatabaseUrl to throw when DATABASE_URL is missing",
			);
		} catch (error) {
			expect((error as Error).message).toBe("DATABASE_URL is not set");
		}
	});

	it("getSql は複数回呼ばれても同じ postgres クライアントを再利用する", async () => {
		process.env.DATABASE_URL =
			"postgresql://postgres:postgres@localhost:5432/todo_db";

		const { getDatabaseUrl, getSql } = await importDbModule();
		const firstClient = getSql();
		const secondClient = getSql();

		expect(getDatabaseUrl()).toBe(
			"postgresql://postgres:postgres@localhost:5432/todo_db",
		);
		expect(firstClient).toBe(secondClient);
	});
});
