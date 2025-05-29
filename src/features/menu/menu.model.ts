import { menusTable } from '@config/drizzle/tables/menus.table'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

export type Menu = typeof menusTable.$inferSelect

export type NewMenu = typeof menusTable.$inferInsert

export const tMenu = createSelectSchema(menusTable);

export const tNewMenu = createInsertSchema(menusTable);