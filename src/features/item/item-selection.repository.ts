import db from '@config/drizzle/db'
import { itemSelectionsTable } from '@config/drizzle/tables/items.table'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import Repository from '@utils/types/repository'
import { eq } from 'drizzle-orm'
import { projSelect } from '@config/drizzle/query-wrappers'
import { SelectProjection } from '@utils/types/drizzle/queries'

type ItemSelectionProjection = SelectProjection<typeof itemSelectionsTable>;
export type ItemSelection = typeof itemSelectionsTable.$inferSelect;
export type NewItemSelection = typeof itemSelectionsTable.$inferInsert;
export const tItemSelection = createSelectSchema(itemSelectionsTable);
export const tNewItemSelection = createInsertSchema(itemSelectionsTable);

class ItemSelectionRepository extends Repository<typeof itemSelectionsTable> {

	index(projection?: ItemSelectionProjection) {
		return projSelect(projection).from(itemSelectionsTable).$dynamic();
	}

	get(id: number, projection?: ItemSelectionProjection) {
		return projSelect(projection).from(itemSelectionsTable).where(eq(itemSelectionsTable.id, id)).$dynamic();
	}

	create(itemSelection: NewItemSelection) {
		return db.insert(itemSelectionsTable).values(itemSelection).returning().$dynamic();
	}

	update(itemSelection: Partial<NewItemSelection> & Pick<ItemSelection, "id">) {
		return db.update(itemSelectionsTable).set(itemSelection).where(eq(itemSelectionsTable.id, itemSelection.id)).$dynamic();
	}

	remove(id: number) {
		return db.delete(itemSelectionsTable).where(eq(itemSelectionsTable.id, id)).$dynamic();
	}
}

export default ItemSelectionRepository;