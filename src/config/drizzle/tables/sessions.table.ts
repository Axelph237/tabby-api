import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { menusTable } from '@config/drizzle/tables/menus.table'
import { user } from '@config/drizzle/types/user'
import { relations } from 'drizzle-orm'
import { usersTable } from '@config/drizzle/tables/users.table'
import { ordersTable } from '@config/drizzle/tables/orders.table'

export const sessionsTable = pgTable("sessions", {
	id: uuid().primaryKey().defaultRandom(),
	menuId: uuid().notNull().references(() => menusTable.id),
	expiresAt: timestamp(),
})

export const sessionsRelations = relations(sessionsTable, ({ one, many }) => ({
	menu: one(menusTable, {
		fields: [sessionsTable.menuId],
		references: [menusTable.id]
	}),
	admins: many(sessionAdminsTable),
	orders: many(ordersTable)
}))

export const sessionAdminsTable = pgTable("session_admins", {
	sessionId: uuid().notNull().references(() => sessionsTable.id),
	userId: user().notNull()
}, t => [
	primaryKey({ columns: [t.sessionId, t.userId] })
])

export const sessionAdminsRelations = relations(sessionAdminsTable, ({ one }) => ({
	session: one(sessionsTable, {
		fields: [sessionAdminsTable.sessionId],
		references: [sessionsTable.id]
	}),
	user: one(usersTable, {
		fields: [sessionAdminsTable.userId],
		references: [usersTable.id]
	})
}))

