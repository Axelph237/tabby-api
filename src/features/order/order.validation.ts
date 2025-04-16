import { Static, t } from 'elysia'
import { uuidTObj } from '@utils/types/uuid'

export const orderTObj = t.Object({
	id: t.Integer(),
	session_id: uuidTObj,
	placed_at: t.Date(),
	guest_name: t.String(),
	order_num: t.Integer(),
	total_cost: t.Integer(),
	total_items: t.Integer(),
	status: t.String()
});
export type Order = Static<typeof orderTObj>;

export const orderLineItemTObj = t.Object({
	id: t.Integer(),
	item_id: t.Integer(),
	order_id: t.Integer(),
	count: t.Integer(),
	unit_price: t.Integer(),
	selections: t.Array(t.Integer())
});
export type OrderLineItem = Static<typeof orderLineItemTObj>;