import { boolean, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import { authSchema } from '@config/drizzle/schemas'
import { relations } from 'drizzle-orm'
import { accountsTable } from '@config/drizzle/tables/accounts.table'

export const usersTable = authSchema.table("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	...timestamps
})

export const usersRelations = relations(usersTable, ({ many })  => ({
	accounts: many(accountsTable)
}))