import db, { _projSelect, Projection } from '@config/drizzle/db'
import { menusTable } from '@config/drizzle/tables/menus.table'
import Repository from '@utils/types/repository'
import { UUID } from '@utils/types/typebox/uuid'
import { and, eq } from 'drizzle-orm'
import { itemsToMenusJTable } from '@config/drizzle/tables/items.table'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { Timeless } from '@utils/types/typebox/timeless'

export type Menu = typeof menusTable.$inferSelect
export type NewMenu = typeof menusTable.$inferInsert
export const tMenu = createSelectSchema(menusTable);
export const tNewMenu = createInsertSchema(menusTable);

type MenuProjection = Projection<typeof menusTable>;

class MenuRepository extends Repository<typeof menusTable> {
	index(projection?: MenuProjection) {
		return _projSelect(projection).from(menusTable).$dynamic();
	}

	get(id: UUID, projection?: MenuProjection) {
		return _projSelect(projection).from(menusTable).where(eq(menusTable.id, id)).$dynamic();
	}

	create(menu: Timeless<NewMenu>) {
		return db.insert(menusTable).values(menu).returning().$dynamic();
	}

	update(menu: Partial<NewMenu> & Pick<Menu, "id">) {
		return db.update(menusTable).set(menu).where(eq(menusTable.id, menu.id)).$dynamic();
	}

	remove(id: UUID) {
		return db.delete(menusTable).where(eq(menusTable.id, id)).$dynamic();
	}

	$addItemToMenu(itemId: number, menuId: UUID) {
		return db.insert(itemsToMenusJTable).values({ itemId, menuId }).returning().$dynamic();
	}

	$removeItemFromMenu(itemId: number, menuId: UUID) {
		return db.delete(itemsToMenusJTable).where(and(
			eq(itemsToMenusJTable.itemId, itemId),
			eq(itemsToMenusJTable.menuId, menuId)
		)).$dynamic();
	}
}

export default MenuRepository;