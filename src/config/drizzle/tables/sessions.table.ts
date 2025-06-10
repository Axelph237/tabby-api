import { pgTable, primaryKey, timestamp, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { menusTable } from '@config/drizzle/tables/menus.table'
import { usersTable } from '@config/drizzle/tables/users.table'
import { ordersTable } from '@config/drizzle/tables/orders.table'
import { user } from '@utils/types/drizzle/user'
import { currentUser } from '../views'

export const sessionsTable = pgTable("sessions", {
	id: uuid().primaryKey().defaultRandom(),
	menuId: uuid().notNull().references(() => menusTable.id),
	expiresAt: timestamp(),
}, t => [
	// Policies
	// Allows SELECT for all
	pgPolicy("readSession", {
		as: "permissive",
		to: "all",
		for: "select",
		using: sql`TRUE`
	}),
	// Allow ALL for menu owners
	pgPolicy("crudForMenuOwners", {
		as: "permissive",
		to: "authorized",
		for: "all",
		using: sql`EXISTS (
			SELECT 1 FROM menus 
			WHERE menus.id = menu_id 
				AND menus.owner_id = ${currentUser})`,
		withCheck: sql`EXISTS (
			SELECT 1 FROM menus 
			WHERE menus.id = menu_id 
				AND menus.owner_id = ${currentUser})`
	})
])

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
	primaryKey({ columns: [t.sessionId, t.userId] }),
	// Policies
	// Allows ALL for session owners
	pgPolicy("crudAdminsOnOwnSession", {
		as: "permissive",
		to: "authorized",
		for: "select",
		using: sql`EXISTS (
			SELECT 1 FROM sessions 
			JOIN menus ON menus.id = sessions.menu_id 
			WHERE sessions.id = session_id 
				AND menus.owner_id = ${currentUser})`,
		withCheck: sql`EXISTS (
			SELECT 1 FROM sessions 
			JOIN menus ON menus.id = sessions.menu_id 
			WHERE sessions.id = session_id 
				AND menus.owner_id = ${currentUser})`
	}),
	// Allows SELECT for self
	pgPolicy("readSelf", {
		as: "permissive",
		to: "authorized",
		for: "select",
		using: sql`user_id = ${currentUser}`
	}),
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

