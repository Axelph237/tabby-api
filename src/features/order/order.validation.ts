import { Static, t } from 'elysia'
import { uuidObj } from '@utils/types/uuid'

export const orderObj = t.Object({
	id: t.Integer(),
	session_id: uuidObj,
	placed_at: t.Date(),
	guest_name: t.String(),
	order_num: t.Integer(),
	total_cost: t.Integer(),
	total_items: t.Integer(),
	status: t.String()
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