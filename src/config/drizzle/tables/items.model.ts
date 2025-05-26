import { boolean, index, integer, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core'
import { timestamps } from '@config/drizzle/types/timestamps'
import PublicSchema from '@config/drizzle/schemas/public'
import { menusTable } from '@config/drizzle/tables/menus.model'
import { user } from '@config/drizzle/types/user'

export const itemSelectionsTable = PublicSchema.table("item_selections", {
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

export const itemOptionsTable = PublicSchema.table("item_options", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	label: text().notNull(),
	type: text().notNull(),
	itemId: integer().notNull().references(() => itemsTable.id),
	createdBy: user().notNull()
}, t => [
	unique().on(t.itemId, t.label),
	index("item_options_created_by_hash").using("hash", t.createdBy)
])

export const itemsTable = PublicSchema.table("items",{
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

export const itemsToMenusTable = PublicSchema.table("items_to_menus", {
	itemId: integer().notNull().references(() => itemsTable.id),
	menuId: uuid().notNull().references(() => menusTable.id)
}, t => [
	primaryKey({ columns: [t.itemId, t.menuId] })
])