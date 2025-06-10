import { drizzle, NeonHttpQueryResult } from 'drizzle-orm/neon-http';
import * as models from "./tables/exports";
import * as schemas from "./schemas";
import * as roles from "./roles"
import { SelectedFields, sql } from 'drizzle-orm'
import {
	PgDelete, PgInsert,
	PgSelect,
	PgTableWithColumns, PgUpdate
} from 'drizzle-orm/pg-core'
import { UUID } from '@utils/types/typebox/uuid'
import { PgRaw } from 'drizzle-orm/pg-core/query-builders/raw';
import { neon, Query } from '@neondatabase/serverless';

const sqlClient = neon(process.env.TLS_POSTGRES_DATABASE_URL!);
const db = drizzle({
	client: sqlClient,
	casing: "snake_case",
	schema: {...models, ...schemas, ...roles},
	logger: true
});
export default db;

// Db types
export type Projection<TTable extends PgTableWithColumns<any>> = SelectedFields<any, TTable>;
export type AnyDrizzleQuery = PgSelect<any> | PgInsert<any> | PgUpdate<any> | PgDelete<any> | PgRaw<any>

// Special db functions
export function _projSelect<P extends PgTableWithColumns<any>>(projection?: Projection<P>) {
	return (projection ? db.select(projection) : db.select())
}

export function _asUser(userId: UUID, query: AnyDrizzleQuery): Promise<NeonHttpQueryResult<Record<string, unknown>>> {
	return new Promise(async (resolve, reject) => {
		const batchResult: NeonHttpQueryResult<Record<string, unknown>>[] = await db.batch([
			db.execute(sql`SET ROLE anon;`),
			db.execute(sql`SELECT set_config('tabby.transaction.current_user', '${sql.raw(userId)}', TRUE)`),
			query,
			db.execute(sql`SELECT set_config('tabby.transaction.current_user', NULL, TRUE);`),
			db.execute(sql`RESET ROLE;`)
		])

		const queryResult = batchResult[2];
		resolve(queryResult);
	})
}