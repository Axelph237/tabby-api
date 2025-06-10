import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/typebox/uuid'
import OrderRepository, { tNewOrder, tNewOrderLineItem } from './order.repository'
import { _asGuest, _asGuestTransaction, _asUser } from '@config/drizzle/query-wrappers'

export const orderRoutes = new Elysia({ prefix: "/orders/:sessId" })
	.use(authMiddleware)
	.guard({ params: t.Object({ sessId: uuidTObj }) })
	.decorate("orderRepo", new OrderRepository())
	// 3.1 - Get all orders for a given session
	.get("/", ({ orderRepo, user }) => 
		_asUser(user?.id, orderRepo.index()), 
		{
			isAuthenticated: true
		})
	// 3.2 - Add an order to a session
	.post("/", ({ body, orderRepo }) => 
		_asGuestTransaction(orderRepo.$place(body)),
		{
			body: t.Intersect([tNewOrder, t.Object({ items: t.Array(tNewOrderLineItem) })])
		})
	// 3.3 - Cancel an order for a session
	.delete("/:orderId", ({ params, user, orderRepo }) => 
		_asUser(user?.id, orderRepo.$setStatus(params.orderId, "canceled")), 
		{
			params: t.Object({
				orderId: t.Integer()
			}),
			isAuthenticated: true
		})