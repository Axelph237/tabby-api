import { Static, t } from 'elysia'
import { itemTObj, itemOptionTObj, itemSelectTObj } from '../item/item.validation'
import { uuidTObj } from '@utils/types/uuid'

export const sessionTObj = t.Object({
	id: uuidTObj,
	menu_id: uuidTObj,
	expires_at: t.Date()
});
export type Session = Static<typeof sessionTObj>;

export const sessionDetailsTObj = t.Object({
	menu_name: t.String(),
	expires_at: t.Nullable(t.Date()),
	items: t.Array(t.Intersect([
		// Items w/o sensitive details
		// and add options
		t.Omit(itemTObj, [ "created_by", "created_at" ]),
		t.Object({
			options: t.Array(t.Intersect([
				// Options only with necessary details
				// and add selections
				t.Pick(itemOptionTObj, [ "type", "label" ]),
				t.Object({
					// Selections only with necessary details
					selections: t.Array(t.Pick(itemSelectTObj, [ "label", "price", "is_default" ]))
				})
			]))
		})
	]))
})
export type SessionDetails = Static<typeof sessionDetailsTObj>;