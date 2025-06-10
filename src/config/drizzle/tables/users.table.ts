import { boolean, text, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { timestamps } from '@utils/types/drizzle/timestamps'
import { authSchema } from '@config/drizzle/schemas'
import { accountsTable } from '@config/drizzle/tables/accounts.table'
import { currentUser } from '../views'

export const usersTable = authSchema.table("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	...timestamps
}, t => [
	// Policies
	// Allows INSERT for all
	pgPolicy("insertForAll", {
		as: "permissive",
		to: "all",
		for: "insert",
		using: sql`TRUE`,
		withCheck: sql`TRUE`
	}),
	// Allows SELECT for self
	pgPolicy("selectForSelf", {
		as: "permissive",
		to: "authorized",
		for: "select",
		using: sql`id = ${currentUser}`
	}),
	// Allows DELETE for self
	pgPolicy("deleteForSelf", {
		as: "permissive",
		to: "authorized",
		for: "select",
		using: sql`id = ${currentUser}`
	})
	// Update only allowed on superuser
])

export const usersRelations = relations(usersTable, ({ many })  => ({
	accounts: many(accountsTable)
}))