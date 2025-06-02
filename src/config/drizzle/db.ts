import { drizzle } from 'drizzle-orm/bun-sql';
import * as models from "./tables/exports";
import * as authSchema from "./schemas/auth";
import { SelectedFields, sql } from 'drizzle-orm'
import {
	PgDelete, PgInsert,
	PgSelect,
	PgTableWithColumns, PgUpdate,
} from 'drizzle-orm/pg-core'
import { UUID } from '@utils/types/typebox/uuid'
import { SQL } from 'bun'

export const client = new SQL({
	hostname: "localhost",
	port: 5432,
	user: "postgres",
	password: "postgres",
	username: "postgres"
});
await client.connect();
console.log(client.options);

const db = drizzle(client, {
	casing: "snake_case",
	schema: {...models, ...authSchema},
	logger: true
});
console.log("drizzle: Connected to db @", process.env.TLS_POSTGRES_DATABASE_URL!);
export default db;

// Db types
export type Projection<TTable extends PgTableWithColumns<any>> = SelectedFields<any, TTable>;
type AnyDrizzleQuery = PgSelect<any> | PgInsert<any> | PgUpdate<any> | PgDelete<any>

// Special db functions
export function _projSelect<P extends PgTableWithColumns<any>>(projection?: Projection<P>) {
	return (projection ? db.select(projection) : db.select())
}

export async function _asUser(userId: UUID, query: AnyDrizzleQuery): Promise<unknown[]> {
	return await db.transaction(async (tx) => {
		// Set RLS perms
		await tx.execute(sql`SELECT set_config('request.jwt.claims.sub', '${sql.raw(userId)}', TRUE)`)
		// Main query
		const result = await tx.execute(query);
		// Remove RLS perms
		await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', NULL, TRUE);`);

		return result;
	})
}