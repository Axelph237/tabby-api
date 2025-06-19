import Repository from '@utils/types/repository'
import { itemOptionsTable, itemSelectionsTable, itemsTable } from '@config/drizzle/tables/items.table'
import db from '@config/drizzle/db'
import { eq, getTableColumns, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import ItemOptionRepository from '@features/item/item-option.repository'
import ItemSelectionRepository from './item-selection.repository'
import { projSelect, projSelectWith } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'
import { syncBuiltinESMExports } from 'node:module'

type ItemProjection = SelectProjection<typeof itemsTable>;
export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;
export const tItem = createSelectSchema(itemsTable);
export const tNewItem = createInsertSchema(itemsTable);

class ItemRepository extends Repository<typeof itemsTable> {
	$options: ItemOptionRepository;

	constructor() {
		super();
		this.$options = new ItemOptionRepository();
	}

	// The following code block is annoying and hopefully redeemable down the line
	// Major problem: not flexible when selections or options tables change
	#itemObjs = () => {
		const selectionsCTE = db.$with('selectionsSQ').as(
			this.$options.$selections.index({
			parentOptionId: sql<number>`coalesce(${itemSelectionsTable.parentOptionId}, 0)`.as('parent_option_id'),
			parentItemId: itemSelectionsTable.parentItemId,
			selections: sql<{ label: string, price: number, isDefault: boolean }[]>`coalesce(jsonb_agg(jsonb_build_object(
				'label', ${itemSelectionsTable.label},
				'price', coalesce(${itemSelectionsTable.price}, 0),
				'is_default', coalesce(${itemSelectionsTable.isDefault}, FALSE)
			)), '[]'::jsonb)`.as('selections')
			}).groupBy(itemSelectionsTable.parentOptionId, itemSelectionsTable.parentItemId)
		)

		const optionsCTE = db.$with('optionsSQ').as(
			db.with(selectionsCTE).select({
			parentItemId: selectionsCTE.parentItemId,
			options: sql`coalesce(jsonb_agg(jsonb_build_object(
				'label', coalesce(${itemOptionsTable.label}, '_root'),
				'type', coalesce(${itemOptionsTable.type}, 'many'),
				'selections', ${selectionsCTE.selections}
			)), '[]'::jsonb)`.as('options')
			}).from(selectionsCTE).fullJoin(itemOptionsTable, eq(itemOptionsTable.id, selectionsCTE.parentOptionId)).groupBy(selectionsCTE.parentItemId)
		);

		return db.with(optionsCTE).select({
			...getTableColumns(itemsTable),
			options: sql`coalesce(${optionsCTE.options}, '[]'::jsonb)`.as('options')
		}).from(itemsTable).leftJoin(optionsCTE, eq(itemsTable.id, optionsCTE.parentItemId)).$dynamic();
	}

	index(projection?: ItemProjection) {
		const itemObjsCTE = db.$with('itemObjsCTE').as(this.#itemObjs());
		return projSelectWith(itemObjsCTE, projection).from(itemObjsCTE).$dynamic();
	}

	get(id: number, projection?: ItemProjection) {
		const itemObjsCTE = db.$with('itemObjsCTE').as(this.#itemObjs());
		return projSelectWith(itemObjsCTE, projection).from(itemObjsCTE).limit(1).$dynamic();
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