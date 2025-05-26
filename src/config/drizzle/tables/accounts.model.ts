import { text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import AuthSchema from '@config/drizzle/schemas/auth'
import { users } from '@config/drizzle/tables/users.model'

export const accountsTable = AuthSchema.table("accounts", {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid().notNull().references(() => users.id),
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