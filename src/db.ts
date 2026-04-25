import { ok } from "node:assert/strict";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: `${import.meta.dir}/../.env` });

let sql: postgres.Sql | undefined;

export const getDatabaseUrl = () => {
	const databaseUrl = process.env.DATABASE_URL;

	ok(databaseUrl, "DATABASE_URL is not set");

	return databaseUrl;
};

export const getSql = () => {
	const databaseUrl = getDatabaseUrl();

	sql ??= postgres(databaseUrl);

	return sql;
};
