import { jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import { user } from '@config/drizzle/types/user'
import { relations } from 'drizzle-orm'
import { itemsToMenusJTable } from '@config/drizzle/tables/items.table'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'

export const menusTable = pgTable("menus", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	style: jsonb(),
	createdBy: user().notNull(),
	...timestamps
})

export const menusRelations = relations(menusTable, ({ many }) => ({
	itemsToMenus: many(itemsToMenusJTable),
	sessions: many(sessionsTable)
}))