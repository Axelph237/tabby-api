import { SelectProjection } from '@utils/types/drizzle/queries'
import {
	PgDeleteDynamic,
	PgInsertDynamic,
	PgSelectDynamic,
	PgTableWithColumns, PgUpdateDynamic,
} from 'drizzle-orm/pg-core'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

abstract class Repository<TTable extends PgTableWithColumns<any>> {

	abstract index(projection?: InferSelectModel<TTable>): PgSelectDynamic<any>;

	abstract get(id: unknown, projection?: SelectProjection<TTable>): PgSelectDynamic<any>;

	abstract create(item: InferInsertModel<TTable>): PgInsertDynamic<any>;

	abstract update(item: Partial<InferInsertModel<TTable>> & any): PgUpdateDynamic<any>;

	abstract remove(id: unknown): PgDeleteDynamic<any>;
}

export default Repository;