import { Static, t } from 'elysia'

// Commonly ignored keys for various functions
export const ignoredKeys = ["id", "created_at", "created_by"]

export const uuidObj = t.String({ format: 'uuid' })
export type UUID = Static<typeof uuidObj>

// ---- TABLE OBJECTS
// Menus
export const menuObj = t.Object({
	id: uuidObj,
	created_at: t.Date(),
	created_by: uuidObj,
	name: t.String(),
})
export type Menu = Static<typeof menuObj>

// Carts
export const cartObj = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObj,
	menu_id: uuidObj,
})
export type Cart = Static<typeof cartObj>

// Items
export const itemObj = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObj,
	name: t.String(),
	description: t.Nullable(t.String()),
	img_url: t.Nullable(t.String({ format: 'uri' })),
	base_price: t.Integer(),
})
export type Item = Static<typeof itemObj>

export enum ItemOptionTypes {
	One = 'one',
	Many = 'many',
	Text = 'text',
}
export const itemOptionObj = t.Object({
	id: t.Integer(),
	created_by: uuidObj,
	label: t.String(),
	type: t.Union([t.Literal('one'), t.Literal('many'), t.Literal('text')]),
	item_id: t.Integer(),
})
export type ItemOption = Static<typeof itemOptionObj>

export const itemSelectObj = t.Object({
	id: t.Integer(),
	created_by: uuidObj,
	label: t.String(),
	price: t.Integer(),
	is_default: t.Boolean(),
	option_id: t.Integer(),
})
export type ItemSelection = Static<typeof itemSelectObj>

export const menuItemObj = t.Object({
	id: uuidObj,
	item_id: t.Integer(),
	created_by: uuidObj,
	menu_id: uuidObj,
})
export type MenuItem = Static<typeof menuItemObj>

export const orderObj = t.Object({
	id: t.Integer(),
	session_id: uuidObj,
	guest_name: t.String(),
	order_num: t.Integer(),
	total_cost: t.Integer(),
	total_items: t.Integer()
});
export type Order = Static<typeof orderObj>;

export const orderLineItem = t.Object({
	id: t.Integer(),
	item_id: t.Integer(),
	order_id: t.Integer(),
	count: t.Integer(),
	unit_price: t.Integer(),
	selections: t.Array(t.Integer())
});
export type OrderLineItem = Static<typeof orderLineItem>;

export const session = t.Object({
	id: uuidObj,
	menu_id: uuidObj,
	expires_at: t.Date()
});
export type Session = Static<typeof session>;

export const cartItemObj = t.Object({
	id: t.Integer(),
	cart_id: t.Integer(),
	item_id: t.Integer(),
	count: t.Integer(),
	unit_price: t.Integer(),
})
export type CartItem = Static<typeof cartItemObj>

// ---- FUNCTION OBJECTS
export const itemDetailsObj = t.Object({
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
export type ItemDetails = Static<typeof itemDetailsObj>;

export const cartDetailsObj = t.Object({
	id: t.Integer(),
	created_at: t.Date(),
	created_by: uuidObj,
	menu_id: uuidObj,
	total_cost: t.Integer(),
	cart_items: t.Array(
		t.Object({
			item_id: t.Integer(),
			count: t.Integer(),
		})
	),
})
export type CartDetails = Static<typeof cartDetailsObj>

export const cartItemDetailsObj = t.Object({
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
export type CartItemDetails = Static<typeof cartItemDetailsObj>
