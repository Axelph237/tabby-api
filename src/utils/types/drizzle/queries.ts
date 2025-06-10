import { PgDelete, PgInsert, PgSelect, PgTableWithColumns, PgTransaction, PgUpdate } from "drizzle-orm/pg-core";
import { SelectedFields } from 'drizzle-orm'
import { PgRaw } from "drizzle-orm/pg-core/query-builders/raw";
import { NeonHttpQueryResult } from "drizzle-orm/neon-http";

export type NeonQueryResult = NeonHttpQueryResult<Record<string, unknown>>;
export type SelectProjection<TTable extends PgTableWithColumns<any>> = SelectedFields<any, TTable>;
export type AnySimpleQuery = PgSelect<any> | PgInsert<any> | PgUpdate<any> | PgDelete<any> | PgRaw<any>
export type AnyQuery = AnySimpleQuery | PgTransaction<any>