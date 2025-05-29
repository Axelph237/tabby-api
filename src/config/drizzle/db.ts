import 'dotenv/config';
import { drizzle } from 'drizzle-orm/bun-sql';
import * as models from "./tables/exports";
import * as authSchema from "./schemas/auth";
import * as publicSchema from "./schemas/public";
import { Column, InferSelectModel, SelectedFields, Table, TableConfig } from 'drizzle-orm'

const db = drizzle({
	connection: process.env.TLS_POSTGRES_DATABASE_URL!,
	casing: "snake_case",
	schema: {...models, ...authSchema, ...publicSchema}
});
export default db;

// Db types
type TableDetails = Table<TableConfig<Column<any, object, object>>>
export type Projection<TTable extends TableDetails = any> = SelectedFields<any, TTable>;

// Special db functions
export function _projSelect<P extends TableDetails = any>(projection?: Projection<P>) {
	return (projection ? db.select(projection) : db.select())
}