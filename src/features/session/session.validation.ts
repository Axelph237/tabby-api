import { Static, t } from 'elysia'
import { itemObj, itemOptionObj, itemSelectObj } from '../item/item.validation'
import { uuidObj } from '@utils/types/uuid'

export const session = t.Object({
	id: uuidObj,
	menu_id: uuidObj,
	expires_at: t.Date()
});
export type Session = Static<typeof session>;

export const sessionDetailsObj = t.Object({
	menu_name: t.String(),
	expires_at: t.Nullable(t.Date()),
	items: t.Array(t.Intersect([
		// Items w/o sensitive details
		// and add options
		t.Omit(itemObj, [ "created_by", "created_at" ]),
		t.Object({
			options: t.Array(t.Intersect([
				// Options only with necessary details
				// and add selections
				t.Pick(itemOptionObj, [ "type", "label" ]),
				t.Object({
					// Selections only with necessary details
					selections: t.Array(t.Pick(itemSelectObj, [ "label", "price", "is_default" ]))
				})
			]))
		})
	]))
})
export type SessionDetails = Static<typeof sessionDetailsObj>;