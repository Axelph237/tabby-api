import db, { _projSelect, Projection } from '@config/drizzle/db'
import { itemOptionsTable } from '@config/drizzle/tables/items.table'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import Repository from '@utils/types/repository'
import { eq, sql } from 'drizzle-orm'
import ItemSelectionRepository from '@features/item/itemSelection.repository'

type ItemOptionProjection = Projection<typeof itemOptionsTable>;
export type ItemOption = typeof itemOptionsTable.$inferSelect;
export type NewItemOption = typeof itemOptionsTable.$inferInsert;
export const tItemOption = createSelectSchema(itemOptionsTable);
export const tNewItemOption = createInsertSchema(itemOptionsTable);

class ItemOptionRepository extends Repository<typeof itemOptionsTable> {
	$selections: ItemSelectionRepository;

	constructor() {
		super();
		this.$selections = new ItemSelectionRepository();
	}

	static #objsView = sql.raw(
		db.query.itemOptionsTable.findMany({
			with: {
				selections: true
			}
		}).toSQL().sql)

	index(projection?: ItemOptionProjection) {
		return _projSelect(projection).from(ItemOptionRepository.#objsView).$dynamic();
	}

	get(id: number, projection?: ItemOptionProjection) {
		return _projSelect(projection).from(ItemOptionRepository.#objsView)
			.limit(1).where(eq(itemOptionsTable.id, id)).$dynamic();
	}

	create(itemOption: NewItemOption) {
		return db.insert(itemOptionsTable).values(itemOption).returning().$dynamic();
	}

	update(itemOption: Partial<NewItemOption> & Pick<ItemOption, "id">) {
		return db.update(itemOptionsTable).set(itemOption).where(eq(itemOptionsTable.id, itemOption.id)).$dynamic();
	}

	remove(id: number) {
		return db.delete(itemOptionsTable).where(eq(itemOptionsTable.id, id)).$dynamic();
	}
}

export default ItemOptionRepository;