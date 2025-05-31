import Repository from '@utils/types/repository'
import { itemSelectionsTable, itemsTable } from '@config/drizzle/tables/items.table'
import db, { _asUser, _projSelect, Projection } from '@config/drizzle/db'
import { eq, KnownKeysOnly, sql, SQLWrapper } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

type ItemProjection = Projection<typeof itemsTable>;

export type Item = typeof itemsTable.$inferSelect;

export type NewItem = typeof itemsTable.$inferInsert;

export const tItem = createSelectSchema(itemsTable);

export const tNewItem = createInsertSchema(itemsTable);

class ItemRepository extends Repository<typeof itemsTable> {

	 itemsQuery(opts?: { limit?: number }) {
		 const query = db.query.itemsTable.findMany({
			 with: {
				 options: {
					 with: {
						 selections: true
					 }
				 }
			 },
			 ...opts
		 	}).toSQL();

		 return sql.raw(query.sql);
	 }

	index(projection?: ItemProjection) {
		return _projSelect(projection).from(this.itemsQuery()).$dynamic();
	}

	get(id: number, projection?: ItemProjection) {
		return _projSelect(projection).from(this.itemsQuery({ limit: 1 })).$dynamic();
	}

	create(item: NewItem) {
		return db.insert(itemsTable).values(item).returning().$dynamic();
	}

	update(item: Partial<Item> & Pick<Item, "id">) {
		return db.update(itemsTable).set(item).where(eq(itemsTable.id, item.id)).$dynamic();
	}

	remove(id: number) {
		return db.delete(itemsTable).where(eq(itemsTable.id, id)).$dynamic();
	}
}

export default ItemRepository;