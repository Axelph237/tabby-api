import { jsonb, pgTable, text, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import { user } from '@config/drizzle/types/user'
import { relations, sql } from 'drizzle-orm'
import { itemsToMenusJTable } from '@config/drizzle/tables/items.table'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'
import { currentUser } from '@config/drizzle/views';

export const menusTable = pgTable("menus", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	style: jsonb(),
	createdBy: user().notNull(),
	...timestamps
}, (t) => [
	pgPolicy("onlyReadOwnTables", {
		as: "permissive",
		to: "public",
		for: "all",
		using: sql`created_by = ${currentUser}`
	})
])



export const menusRelations = relations(menusTable, ({ many }) => ({
	itemsToMenus: many(itemsToMenusJTable),
	sessions: many(sessionsTable)
}))