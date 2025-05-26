import {
	integer,
	pgSchema,
	primaryKey,
	unique,
	uuid,
	text,
	boolean,
	jsonb,
	timestamp, index,
} from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/schemas/timestamp.columns'
import { user } from '@config/drizzle/schemas/auth.schema'

export const publicSchema = pgSchema("public")

// TODO See if cart tables are unused in API and delete if so
// export const cartItemSelectionsTable = publicSchema.table("cart_item_selections", {
// 	cartItemId: integer().notNull(),
// 	optionSelection: integer().notNull(),
// }, t => [
// 	primaryKey({ columns: [t.cartItemId, t.optionSelection] })
// ])

// export const cartItemsTable = publicSchema.table("cart_items", {
// 	id: integer().primaryKey().generatedAlwaysAsIdentity(),
// 	cartId: integer().notNull(),
// 	itemId: integer().notNull(),
// 	count: integer(),
// 	unit_price: integer()
// })

// export const cartsTable = publicSchema.table("carts", {
// 	id: integer().primaryKey().generatedAlwaysAsIdentity(),
// 	menuId: uuid().notNull(),
// 	createdBy,
// 	...timestamps
// }, t => [
// 	unique().on(t.menuId, t.createdBy)
// ])

export const itemSelectionsTable = publicSchema.table("item_selections", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	parentItem: integer().notNull().references(() => itemsTable.id),
	parentOption: integer().references(() => itemOptionsTable.id),
	label: text().notNull(),
	price: integer(),
	isDefault: boolean().default(false),
	createdBy: user().notNull()
}, t => [
	unique().on(t.parentOption, t.parentItem, t.label),
	index("item_selections_created_by_hash").using("hash", t.createdBy)
])

export const itemOptionsTable = publicSchema.table("item_options", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	label: text().notNull(),
	type: text().notNull(),
	itemId: integer().notNull().references(() => itemsTable.id),
	createdBy: user().notNull()
}, t => [
	unique().on(t.itemId, t.label),
	index("item_options_created_by_hash").using("hash", t.createdBy)
])

export const itemsTable = publicSchema.table("items",{
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: text().notNull(),
	description: text(),
	imgUrl: text(),
	basePrice: integer(),
	createdBy: user().notNull(),
	...timestamps
}, t => [
	index("items_created_by_hash").using("hash", t.createdBy)
])

export const itemsToMenusTable = publicSchema.table("items_to_menus", {
	itemId: integer().notNull().references(() => itemsTable.id),
	menuId: uuid().notNull().references(() => menusTable.id)
}, t => [
	primaryKey({ columns: [t.itemId, t.menuId] })
])

export const menusTable = publicSchema.table("menus", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	style: jsonb(),
	createdBy: user().notNull(),
	...timestamps
})

export const sessionsTable = publicSchema.table("sessions", {
	id: uuid().primaryKey().defaultRandom(),
	menuId: uuid().notNull().references(() => menusTable.id),
	expiresAt: timestamp(),
})

export const sessionAdminsTable = publicSchema.table("session_admins", {
	sessionId: uuid().notNull().references(() => sessionsTable.id),
	userId: user().notNull()
}, t => [
	primaryKey({ columns: [t.sessionId, t.userId] })
])

export const ordersTable = publicSchema.table("orders", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	placedAt: timestamp().notNull(),
	sessionId: uuid().notNull(),
	guestName: text().notNull(),
	orderNum: integer(),
	totalCost: integer().default(0).notNull(),
	totalItems: integer().default(0).notNull(),
	status: text().notNull()
}) // TODO add trigger to ordersTable

export const orderLineItemsTable = publicSchema.table("order_line_items", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	itemId: integer().notNull(),
	orderId: integer().notNull(),
	count: integer().notNull(),
	unitPrice: integer().notNull(),
	selections: integer().array()
}) // TODO add triggers to orderLineItemsTable

export default {
	itemSelectionsTable,
	itemOptionsTable,
	itemsTable,
	itemsToMenusTable,
	menusTable,
	sessionsTable,
	sessionAdminsTable,
	ordersTable,
	orderLineItemsTable
};