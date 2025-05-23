import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { orderController } from './order.controller'
import { uuidTObj } from '@utils/types/uuid'
import { orderLineItemTObj } from '@features/order/order.validation'

export const orderRoutes = new Elysia({ prefix: "/orders/:sessId" })
	.use(orderController({
		name: "oc"
	}))
	.use(authMiddleware)
	.guard({
		params: t.Object({
			sessId: uuidTObj
		})
	})
	// 3.2 - Add an order to a session
	.post("/", ({ params, body, oc }) => {
		console.log(body)
		return oc.createOrder(body.guest_name, params.sessId, body.placed_at, body.items);
	}, {
		body: t.Object({
			guest_name: t.String(),
			placed_at: t.Date(),
			items: t.Array(t.Omit(orderLineItemTObj, ["id", "order_id", "unit_price"]))
		})
	})
	// 3.1 & 3.2 are authenticated routes
	.guard({
		isAuthenticated: true
	})
	// 3.1 - Get all orders for a given session
	.get("/", ({ params, oc }) => {
		return oc.getOrders(params.sessId);
	})
	// 3.3 - Cancel an order for a session
	.delete("/:orderId", ({ params, user, oc }) => {
		return oc.cancelOrder(params.orderId);
	}, {
		params: t.Object({
			orderId: t.Integer()
		})
	})