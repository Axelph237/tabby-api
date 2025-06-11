import { sql } from "drizzle-orm";
import { PgTableWithColumns } from "drizzle-orm/pg-core";
import { NeonHttpQueryResult } from "drizzle-orm/neon-http";
import db from "./db";
import { AnyQuery, AnySimpleQuery, NeonQueryResult, SelectProjection } from "@utils/types/drizzle/queries";
import { UUID } from "@utils/types/typebox/uuid";

export function projSelect<P extends PgTableWithColumns<any>>(projection?: SelectProjection<P>) {
	return (projection ? db.select(projection) : db.select())
}

export function asUser<T>(userId: UUID | undefined, query: AnySimpleQuery): Promise<NeonQueryResult<T>> {
	const BATCH_SIZE = 5;
	const RELEVANT_QUERY = 2;

	if (!userId || typeof userId !== "string")
		throw TypeError(`Expected userId to be a string, but received ${userId}`);

	return new Promise(async (resolve, reject) => {
		const result: NeonQueryResult<T>[] = await db.batch([
			db.execute(sql`SET ROLE authorized;`),
			db.execute(sql`SELECT set_config('tabby.transaction.current_user', '${sql.raw(userId)}', TRUE)`),
			query,
			db.execute(sql`SELECT set_config('tabby.transaction.current_user', NULL, TRUE);`),
			db.execute(sql`RESET ROLE;`)
		])

		if (result.length !== BATCH_SIZE)
			reject("_asUser() query wrapper returned unexpected results.")

		resolve(result[RELEVANT_QUERY]);
	})
}

export function asGuest<T>(query: AnySimpleQuery): Promise<NeonQueryResult<T>> {
	const BATCH_SIZE = 3;
	const RELEVANT_QUERY = 1;

	return new Promise(async (resolve, reject) => {
		const result: NeonQueryResult<T>[] = await db.batch([
			db.execute(sql`SET ROLE guest;`),
			query,
			db.execute(sql`RESET ROLE;`)
		])

		if (result.length !== BATCH_SIZE)
			reject("_asGuest() query wrapper returned unexpected results.")

		resolve(result[RELEVANT_QUERY]);
	})
}

export function asUserTransaction<T = any>(userId: UUID, promise: Promise<T>): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`SET ROLE authorized;`);
		await tx.execute(sql`SELECT set_config('tabby.transaction.current_user', '${sql.raw(userId)}', TRUE)`);

		const result = await promise;

		await tx.execute(sql`SELECT set_config('tabby.transaction.current_user', NULL, TRUE);`);
		await tx.execute(sql`RESET ROLE;`);

		return result;
	})
}

export function asGuestTransaction<T = any>(promise: Promise<T>): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`SET ROLE guest;`);
		const result = await promise;
		await tx.execute(sql`RESET ROLE;`);

		return result;
	})
}