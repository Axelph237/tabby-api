import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'
import { itemsTable } from '@config/drizzle/tables/items.table'

export const ordersTable = pgTable("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	placedAt: timestamp().notNull(),
	sessionId: uuid().notNull().references(() => sessionsTable.id),
	guestName: text().notNull(),
	orderNum: integer(),
	totalCost: integer().default(0).notNull(),
	totalItems: integer().default(0).notNull(),
	status: text().notNull()
}) // TODO add trigger to ordersTable

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
	session: one(sessionsTable, {
		fields: [ordersTable.sessionId],
		references: [sessionsTable.id]
	})
}))

export const orderLineItemsTable = pgTable("order_line_items", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	itemId: integer().notNull().references(() => itemsTable.id),
	orderId: integer().notNull().references(() => ordersTable.id),
	count: integer().notNull(),
	unitPrice: integer().notNull(),
	selections: integer().array()
}) // TODO add triggers to orderLineItemsTable

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