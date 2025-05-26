import { boolean, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import AuthSchema from '@config/drizzle/schemas/auth'

export const users = AuthSchema.table("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text().notNull(),
	...timestamps
})