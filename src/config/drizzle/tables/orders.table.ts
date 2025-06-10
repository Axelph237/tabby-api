import { integer, pgTable, text, timestamp, uuid, pgPolicy } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'
import { itemsTable } from '@config/drizzle/tables/items.table'
import { currentUser } from '../views'

export const ordersTable = pgTable("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	placedAt: timestamp().notNull(),
	sessionId: uuid().notNull().references(() => sessionsTable.id),
	guestName: text().notNull(),
	orderNum: integer(),
	totalCost: integer().default(0).notNull(),
	totalItems: integer().default(0).notNull(),
	status: text().notNull()
}, t => [
	// Policies
	// Allows SELECT and INSERT for any
	pgPolicy("readOrders", {
		as: "permissive",
		to: "all",
		for: "select",
		using: sql`true`
	}),
	pgPolicy("writeOrders", {
		as: "permissive",
		to: "all",
		for: "insert",
		using: sql`true`,
		withCheck: sql`true`
	}),
	// And DELETE and UPDATE for owners only
	pgPolicy("deleteOrdersOnOwnSession", {
		as: "permissive",
		to: "authorized",
		for: "delete",
		using: sql`EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id)`
	}),
	pgPolicy("updateOrdersOnOwnSession", {
		as: "permissive",
		to: "authorized",
		for: "update",
		using: sql`EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id)`,
		withCheck: sql`EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id)`
	})
]) // TODO add trigger to ordersTable

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
	session: one(sessionsTable, {
		fields: [ordersTable.sessionId],
		references: [sessionsTable.id]
	}),
	lineItems: many(orderLineItemsTable)
}))

export const orderLineItemsTable = pgTable("order_line_items", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	itemId: integer().notNull().references(() => itemsTable.id),
	orderId: integer().notNull().references(() => ordersTable.id),
	count: integer().notNull(),
	unitPrice: integer().notNull(),
	selections: integer().array()
}, t => [
	// TODO gulp... With no personal identifier attatched to orders I cannot prevent users from inserting
	// new line items after an order has been placed... maybe use automated statuses OPEN only during
	// insert transaction for line items at order creation??? Any other status prevents new items from being added...

	// Policies
	// Allows SELECT for all
	pgPolicy("readLineItems", {
		as: "permissive",
		to: "all",
		for: "select",
		using: sql`true`
	}),
	// Allows guest INSERT on OPEN tickets
	pgPolicy("insertValidItemsOnOpenOrders", {
		as: "restrictive",
		to: "guest",
		for: "insert",
		withCheck: sql`EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.status = 'OPEN')`
	}),
	// Allows CRUD for session admins -> note 
	pgPolicy("readLineItemsAsSessionAdmin", {
		as: "permissive",
		to: "authorized",
		for: "all",
		using: sql`EXISTS (
			SELECT 1 FROM orders 
			JOIN sessions ON sessions.id = orders.session_id 
			JOIN session_admins ON session_admins.session_id = sessions.id
			WHERE orders.id = order_id
				AND session_admins.user_id = ${currentUser})`
	}),

]) // TODO add triggers to orderLineItemsTable

export const orderLineItemsRelations = relations(orderLineItemsTable, ({ one, many }) => ({
	item: one(itemsTable, {
		fields: [orderLineItemsTable.itemId],
		references: [itemsTable.id],
	}),
	order: one(ordersTable, {
		fields: [orderLineItemsTable.orderId],
		references: [ordersTable.id]
	})
}))