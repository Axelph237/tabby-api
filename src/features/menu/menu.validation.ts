import { Static, t } from 'elysia'
import { uuidTObj } from '@utils/types/uuid'

export const menuTObj = t.Object({
	id: uuidTObj,
	created_at: t.Date(),
	created_by: uuidTObj,
	name: t.String(),
	style: t.Nullable(t.Optional(t.Object({
		colors: t.Optional(t.String()),
		backgroundImgSrc: t.Optional(t.String({ format: "uri" })),
		logoImgSrc: t.Optional(t.String({ format: "uri" })),
	})))
})
export type Menu = Static<typeof menuTObj>

export const itemOnMenuTObj = t.Object({
	item_id: t.Integer(),
	menu_id: uuidTObj,
})
export type ItemOnMenu = Static<typeof itemOnMenuTObj>