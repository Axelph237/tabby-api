import { Static, t } from 'elysia'

export const uuidObject = t.String({ format: 'uuid' })
export type UUID = Static<typeof uuidObject>

// ---- TABLE OBJECTS
// Menus
export const menuObject = t.Object({
	id: uuidObject,
	created_at: t.Date(),
	created_by: uuidObject,
	name: t.String(),
})
export type Menu = Static<typeof menuObject>

// Carts
export const cartObject = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObject,
	menu_id: uuidObject,
})
export type Cart = Static<typeof cartObject>

// Items
export const itemObject = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObject,
	name: t.String(),
	description: t.Nullable(t.String()),
	img_url: t.Nullable(t.String({ format: 'uri' })),
	base_price: t.Integer(),
})
export type Item = Static<typeof itemObject>

export enum ItemOptionTypes {
	One = 'one',
	Many = 'many',
	Text = 'text',
}

export const itemOptionObject = t.Object({
	id: t.Integer(),
	created_by: uuidObject,
	label: t.String(),
	type: t.Union([t.Literal('one'), t.Literal('many'), t.Literal('text')]),
	item_id: t.Integer(),
})
export type ItemOption = Static<typeof itemOptionObject>

export const itemOptionSelectObject = t.Object({
	id: t.Integer(),
	created_by: uuidObject,
	label: t.String(),
	price: t.Integer(),
	is_default: t.Boolean(),
	option_id: t.Integer(),
})
export type ItemOptionSelection = Static<typeof itemOptionSelectObject>

export const menuItemObject = t.Object({
	id: uuidObject,
	item_id: t.Integer(),
	created_by: uuidObject,
	menu_id: uuidObject,
})
export type MenuItem = Static<typeof menuItemObject>

export const cartItemObject = t.Object({
	id: t.Integer(),
	cart_id: t.Integer(),
	item_id: t.Integer(),
	count: t.Integer(),
	unit_price: t.Integer(),
})
export type CartItem = Static<typeof cartItemObject>

// ---- FUNCTION OBJECTS
export const itemDetailsObject = t.Object({
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
export type ItemDetails = Static<typeof itemDetailsObject>;

export const cartDetailsObject = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObject,
	menu_id: uuidObject,
	total_cost: t.Integer(),
	cart_items: t.Array(
		t.Object({
			item_id: t.Integer(),
			count: t.Integer(),
		})
	),
})
export type CartDetails = Static<typeof cartDetailsObject>

export const cartItemDetailsObject = t.Object({
	cart_item_id: t.Integer(),
	item_id: t.Integer(),
	name: t.String(),
	description: t.Nullable(t.String()),
	img_url: t.Nullable(t.String()),
	count: t.Integer(),
	unit_price: t.Integer(),
	options: t.Array(
		t.Object({
			name: t.String(),
			type: t.Union([
				t.Literal('one'),
				t.Literal('many'),
				t.Literal('text'),
			]),
			selections: t.Array(
				t.Object({
					label: t.String(),
					price: t.Integer(),
				})
			),
		})
	),
})
export type CartItemDetails = Static<typeof cartItemDetailsObject>
