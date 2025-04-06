import { Static, t } from 'elysia'
import { uuidObj } from '@utils/types/uuid'

export const menuObj = t.Object({
	id: uuidObj,
	created_at: t.Date(),
	created_by: uuidObj,
	name: t.String(),
})
export type Menu = Static<typeof menuObj>

export const itemOnMenuObj = t.Object({
	item_id: t.Integer(),
	menu_id: uuidObj,
})
export type ItemOnMenu = Static<typeof itemOnMenuObj>