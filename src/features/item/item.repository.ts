import Repository from '@utils/types/repository'
import { itemsTable } from '@config/drizzle/tables/items.table'
import db from '@config/drizzle/db'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import ItemOptionRepository from '@features/item/item-option.repository'
import ItemSelectionRepository from './item-selection.repository'
import { _projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'

type ItemProjection = SelectProjection<typeof itemsTable>;
export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;
export const tItem = createSelectSchema(itemsTable);
export const tNewItem = createInsertSchema(itemsTable);

class ItemRepository extends Repository<typeof itemsTable> {
	$options: ItemOptionRepository;
	$selections: ItemSelectionRepository;

	constructor() {
		super();
		this.$options = new ItemOptionRepository();
		this.$selections = new ItemSelectionRepository();
	}

	static #objsView = sql.raw(
		db.query.itemsTable.findMany({
			with: {
				options: {
					with: {
						selections: true
					}
				}
			}
		}).toSQL().sql
	)

	index(projection?: ItemProjection) {
		return _projSelect(projection).from(ItemRepository.#objsView).$dynamic();
	}

	get(id: number, projection?: ItemProjection) {
		 return _projSelect(projection).from(ItemRepository.#objsView)
			 .limit(1).where(eq(itemsTable.id, id)).$dynamic();
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