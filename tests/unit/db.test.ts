import { afterEach, describe, expect, it } from "bun:test";

const originalDbHost = process.env.DB_HOST;
const originalDbPort = process.env.DB_PORT;
const originalDbName = process.env.DB_NAME;
const originalDbUser = process.env.DB_USER;
const originalDbPassword = process.env.DB_PASSWORD;

const importDbModule = async () => {
	return import(`../../src/db.ts?test=${Date.now()}-${Math.random()}`);
};

afterEach(() => {
	if (originalDbHost === undefined) {
		delete process.env.DB_HOST;
	} else {
		process.env.DB_HOST = originalDbHost;
	}

	if (originalDbPort === undefined) {
		delete process.env.DB_PORT;
	} else {
		process.env.DB_PORT = originalDbPort;
	}

	if (originalDbName === undefined) {
		delete process.env.DB_NAME;
	} else {
		process.env.DB_NAME = originalDbName;
	}

	if (originalDbUser === undefined) {
		delete process.env.DB_USER;
	} else {
		process.env.DB_USER = originalDbUser;
	}

	if (originalDbPassword === undefined) {
		delete process.env.DB_PASSWORD;
	} else {
		process.env.DB_PASSWORD = originalDbPassword;
	}
});

describe("db のユニットテスト", () => {
	it("getDatabaseUrl は必須の DB 接続環境変数が未設定なら例外を投げる", async () => {
		const { getDatabaseUrl } = await importDbModule();

		delete process.env.DB_HOST;
		process.env.DB_PORT = "5432";
		process.env.DB_NAME = "todo_db";
		process.env.DB_USER = "postgres";

		try {
			getDatabaseUrl();
			throw new Error(
				"Expected getDatabaseUrl to throw when DB_HOST is missing",
			);
		} catch (error) {
			expect((error as Error).message).toBe("DB_HOST is not set");
		}
	});

	it("getDatabaseUrl は分割された環境変数から接続 URL を組み立てる", async () => {
		process.env.DB_HOST = "localhost";
		process.env.DB_PORT = "5432";
		process.env.DB_NAME = "todo_db";
		process.env.DB_USER = "postgres";
		process.env.DB_PASSWORD = "postgres";

		const { getDatabaseUrl } = await importDbModule();

		expect(getDatabaseUrl()).toBe(
			"postgresql://postgres:postgres@localhost:5432/todo_db",
		);
	});

	it("getSql は複数回呼ばれても同じ postgres クライアントを再利用する", async () => {
		process.env.DB_HOST = "localhost";
		process.env.DB_PORT = "5432";
		process.env.DB_NAME = "todo_db";
		process.env.DB_USER = "postgres";
		process.env.DB_PASSWORD = "postgres";

		const { getDatabaseUrl, getSql } = await importDbModule();
		const firstClient = getSql();
		const secondClient = getSql();

		expect(getDatabaseUrl()).toBe(
			"postgresql://postgres:postgres@localhost:5432/todo_db",
		);
		expect(firstClient).toBe(secondClient);
	});
});
