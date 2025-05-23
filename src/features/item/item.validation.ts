import { Static, t } from 'elysia'
import { uuidTObj } from '@utils/types/uuid'

export const itemTObj = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidTObj,
	name: t.String(),
	description: t.Nullable(t.String()),
	img_url: t.Nullable(t.String({ format: 'uri' })),
	base_price: t.Integer(),
})
export type Item = Static<typeof itemTObj>

export enum ItemOptionTypes {
	One = 'one',
	Many = 'many',
	Text = 'text',
}
export const itemOptionTObj = t.Object({
	id: t.Integer(),
	created_by: uuidTObj,
	label: t.String(),
	type: t.Union([t.Literal('one'), t.Literal('many'), t.Literal('text')]),
	item_id: t.Integer(),
})
export type ItemOption = Static<typeof itemOptionTObj>

export const itemSelectTObj = t.Object({
	id: t.Integer(),
	created_by: uuidTObj,
	label: t.String(),
	price: t.Integer(),
	is_default: t.Boolean(),
	item_id: t.Integer(),
	parent_option: t.Nullable(t.Integer())
})
export type ItemSelection = Static<typeof itemSelectTObj>

// ---- FUNCTION OBJECTS
export const itemDetailsTObj = t.Object({
	id: t.Integer(),
	name: t.String(),
	description: t.Nullable(t.String()),
	img_url: t.Nullable(t.String()),
	base_price: t.Integer(),
	options: t.Nullable(
		t.Array(
			t.Object({
				label: t.String(),
				type: t.Enum(ItemOptionTypes),
				selections: t.Array(
					t.Object({
						label: t.String(),
						price: t.Integer(),
						is_default: t.Boolean(),
					})
				),
			})
		)
	),
});
export type ItemDetails = Static<typeof itemDetailsTObj>;