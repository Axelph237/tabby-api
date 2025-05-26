import { boolean, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import AuthSchema from '@config/drizzle/schemas/auth'
import { relations } from 'drizzle-orm'
import { accountsTable } from '@config/drizzle/tables/accounts.model'

export const usersTable = AuthSchema.table("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text().notNull(),
	...timestamps
})

export const usersRelations = relations(usersTable, ({ many })  => ({
	accounts: many(accountsTable)
}))