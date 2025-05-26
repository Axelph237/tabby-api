import { jsonb, text, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import PublicSchema from '@config/drizzle/schemas/public'
import { user } from '@config/drizzle/types/user'

export const menusTable = PublicSchema.table("menus", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	style: jsonb(),
	createdBy: user().notNull(),
	...timestamps
})