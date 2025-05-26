import { primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import PublicSchema from '@config/drizzle/schemas/public'
import { menusTable } from '@config/drizzle/tables/menus.model'
import { user } from '@config/drizzle/types/user'

export const sessions = PublicSchema.table("sessions", {
	id: uuid().primaryKey().defaultRandom(),
	menuId: uuid().notNull().references(() => menusTable.id),
	expiresAt: timestamp(),
})

export const sessionAdminsTable = PublicSchema.table("session_admins", {
	sessionId: uuid().notNull().references(() => sessions.id),
	userId: user().notNull()
}, t => [
	primaryKey({ columns: [t.sessionId, t.userId] })
])