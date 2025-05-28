import { boolean, index, integer, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import PublicSchema from '@config/drizzle/schemas/public'
import { menusTable } from '@config/drizzle/tables/menus.table'
import { user } from '@config/drizzle/types/user'
import { relations } from 'drizzle-orm'
import { usersTable } from '@config/drizzle/tables/users.table'
import { ordersTable } from '@config/drizzle/tables/orders.table'

export const itemsTable = PublicSchema.table("items",{
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: text().notNull(),
	description: text(),
	imgUrl: text(),
	basePrice: integer(),
	ownerId: user().notNull(),
	...timestamps
}, t => [
	index("items_created_by_hash").using("hash", t.ownerId)
])

export const itemsRelations = relations(itemsTable, ({ one, many }) => ({
	options: many(itemOptionsTable),
	owner: one(usersTable, {
		fields: [itemsTable.ownerId],
		references: [usersTable.id],
	}),
	itemsToMenus: many(itemsToMenusJTable),
	orders: many(ordersTable)
}))

export const itemsToMenusJTable = PublicSchema.table("items_to_menus", {
	itemId: integer().notNull().references(() => itemsTable.id),
	menuId: uuid().notNull().references(() => menusTable.id)
}, t => [
	primaryKey({ columns: [t.itemId, t.menuId] })
])

export const itemsToMenusRelations = relations(itemsToMenusJTable,({ one }) => ({
	item: one(itemsTable, {
		fields: [itemsToMenusJTable.itemId],
		references: [itemsTable.id]
	}),
	menu: one(menusTable, {
		fields: [itemsToMenusJTable.menuId],
		references: [menusTable.id]
	})
}))

export const itemOptionsTable = PublicSchema.table("item_options", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	label: text().notNull(),
	type: text().notNull(),
	parentItemId: integer().notNull().references(() => itemsTable.id),
	ownerId: user().notNull()
}, t => [
	unique().on(t.parentItemId, t.label),
	index("item_options_created_by_hash").using("hash", t.ownerId)
])

export const itemOptionsRelations = relations(itemOptionsTable, ({ one }) => ({
	parentItem: one(itemsTable, {
		fields: [itemOptionsTable.parentItemId],
		references: [itemsTable.id],
	}),
	owner: one(usersTable, {
		fields: [itemOptionsTable.ownerId],
		references: [usersTable.id],
	})
}))

export const itemSelectionsTable = PublicSchema.table("item_selections", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	parentItemId: integer().notNull().references(() => itemsTable.id),
	parentOptionId: integer().references(() => itemOptionsTable.id),
	label: text().notNull(),
	price: integer(),
	isDefault: boolean().default(false),
	ownerId: user().notNull()
}, t => [
	unique().on(t.parentOptionId, t.parentItemId, t.label),
	index("item_selections_created_by_hash").using("hash", t.ownerId)
])

export const itemSelectionsRelations = relations(itemSelectionsTable, ({ one, many  }) => ({
	parentItem: one(itemsTable, {
		fields: [itemSelectionsTable.parentItemId],
		references: [itemsTable.id],
	}),
	parentOption: one(itemOptionsTable, {
		fields: [itemSelectionsTable.parentOptionId],
		references: [itemOptionsTable.id],
	}),
	owner: one(usersTable, {
		fields: [itemSelectionsTable.ownerId],
		references: [usersTable.id],
	})
}))