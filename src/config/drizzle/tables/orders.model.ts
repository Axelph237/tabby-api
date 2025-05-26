import { integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import PublicSchema from '@config/drizzle/schemas/public'

export const orders = PublicSchema.table("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	placedAt: timestamp().notNull(),
	sessionId: uuid().notNull(),
	guestName: text().notNull(),
	orderNum: integer(),
	totalCost: integer().default(0).notNull(),
	totalItems: integer().default(0).notNull(),
	status: text().notNull()
}) // TODO add trigger to ordersTable

export const orderLineItemsTable = PublicSchema.table("order_line_items", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	itemId: integer().notNull(),
	orderId: integer().notNull(),
	count: integer().notNull(),
	unitPrice: integer().notNull(),
	selections: integer().array()
}) // TODO add triggers to orderLineItemsTable