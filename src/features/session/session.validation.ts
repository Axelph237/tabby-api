import { Static, t } from 'elysia'
import { itemObj } from '../item/item.validation'
import { uuidObj } from '@utils/types/uuid'

export const session = t.Object({
	id: uuidObj,
	menu_id: uuidObj,
	expires_at: t.Date()
});
export type Session = Static<typeof session>;

export const sessionDetailsObj = t.Object({
	menu_name: t.String(),
	expires_at: t.Date(),
	items: t.Array(t.Omit(itemObj, [ "created_by", "created_at" ]))
})
export type SessionDetails = Static<typeof sessionDetailsObj>;