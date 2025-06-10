import { text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import { authSchema } from '@config/drizzle/schemas'
import { usersTable } from '@config/drizzle/tables/users.table'
import { relations } from 'drizzle-orm'

export const accountsTable = authSchema.table("accounts", {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid().notNull().references(() => usersTable.id),
	providerId: text().notNull(),
	accessToken: text(),
	tokenType: text(),
	refreshToken: text(),
	accessTokenExpiresAt: timestamp(),
	refreshTokenExpiresAt: timestamp(),
	scope: text(),
	idToken: text(),
	...timestamps
}, t => [
	unique().on(t.userId, t.providerId)
])

export const accountsRelations = relations(accountsTable, ({ one }) => ({
	user: one(usersTable, {
		fields: [accountsTable.userId],
		references: [usersTable.id],
	})
}))