import { ok } from "node:assert/strict";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: `${import.meta.dir}/../.env` });

let sql: postgres.Sql | undefined;

export const getDatabaseUrl = () => {
	const databaseHost = process.env.DB_HOST;
	const databasePort = process.env.DB_PORT;
	const databaseName = process.env.DB_NAME;
	const databaseUser = process.env.DB_USER;
	const databasePassword = process.env.DB_PASSWORD;

	ok(databaseHost, "DB_HOST is not set");
	ok(databasePort, "DB_PORT is not set");
	ok(databaseName, "DB_NAME is not set");
	ok(databaseUser, "DB_USER is not set");

	const encodedUser = encodeURIComponent(databaseUser);
	const encodedPassword = databasePassword
		? `:${encodeURIComponent(databasePassword)}`
		: "";
	const encodedDatabaseName = encodeURIComponent(databaseName);
	const credentials = `${encodedUser}${encodedPassword}`;
	const databaseUrl = `postgresql://${credentials}@${databaseHost}:${databasePort}/${encodedDatabaseName}`;

	return databaseUrl;
};

export const getSql = () => {
	const databaseUrl = getDatabaseUrl();

	sql ??= postgres(databaseUrl);

	return sql;
};
