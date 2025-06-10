import { PgDelete, PgInsert, PgSelect, PgTableWithColumns, PgUpdate } from "drizzle-orm/pg-core";
import { SelectedFields } from 'drizzle-orm'
import { PgRaw } from "drizzle-orm/pg-core/query-builders/raw";

export type SelectProjection<TTable extends PgTableWithColumns<any>> = SelectedFields<any, TTable>;
export type AnyDrizzleQuery = PgSelect<any> | PgInsert<any> | PgUpdate<any> | PgDelete<any> | PgRaw<any>

