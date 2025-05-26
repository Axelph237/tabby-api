import { boolean, integer, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/schemas/timestamp.columns'

export const authSchema = pgSchema("auth")

export const usersTable = authSchema.table("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text().notNull(),
	...timestamps
})

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

export const user = () => uuid().references(() => usersTable.id);

export default {
	usersTable,
	accountsTable
};
