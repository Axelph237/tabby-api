import { PgDelete, PgDeleteBase, PgDeleteDynamic, PgInsert, PgInsertBase, PgInsertDynamic, PgSelect, PgSelectBase, PgSelectDynamic, PgTableWithColumns, PgTransaction, PgUpdate, PgUpdateBase, PgUpdateDynamic } from "drizzle-orm/pg-core";
import { SelectedFields } from 'drizzle-orm'
import { PgRaw } from "drizzle-orm/pg-core/query-builders/raw";
import { NeonHttpQueryResult } from "drizzle-orm/neon-http";

export type NeonQueryResult<T = Record<string, unknown>> = NeonHttpQueryResult<T>;
export type SelectProjection<TTable extends PgTableWithColumns<any>> = SelectedFields<any, TTable>;
export type AnySimpleQuery = 
    | PgSelect<any> 
    | PgInsert<any> 
    | PgUpdate<any> 
    | PgDelete<any> 
    | PgRaw<any>
export type AnyDynamicQuery = 
    | PgSelectDynamic<any>
    | PgInsertDynamic<any>
    | PgUpdateDynamic<any>
    | PgDeleteDynamic<any>
export type AnyQuery = AnySimpleQuery | PgTransaction<any>