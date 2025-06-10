import { jsonb, pgTable, text, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { timestamps } from '@utils/types/drizzle/timestamps'
import { user } from '@utils/types/drizzle/user'
import { relations, sql } from 'drizzle-orm'
import { itemsToMenusJTable } from '@config/drizzle/tables/items.table'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'
import { currentUser } from '@config/drizzle/views';

export const menusTable = pgTable("menus", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	style: jsonb(),
	ownerId: user().notNull(),
	...timestamps
}, (t) => [
	// Policies
	// Allows SELECT for all
	pgPolicy("readMenus", {
		as: "permissive",
		to: "all",
		for: "select",
		using: sql`TRUE`
	}),
	// Allows CRUD for owners
	pgPolicy("crudOwnMenus", {
		as: "permissive",
		to: "authorized",
		for: "all",
		using: sql`owner_id = ${currentUser}`,
		withCheck: sql`owner_id = ${currentUser}`
	})
])

export const menusRelations = relations(menusTable, ({ many }) => ({
	itemsToMenus: many(itemsToMenusJTable),
	sessions: many(sessionsTable)
}))