import { Elysia, t } from 'elysia'
import { uuidObj } from '../+types/schema'
import { PgsqlService } from '../services/psql.service'
import { jwtCheckerPlugin } from '../plugins/jwt-checker.plugin'

export const OrdersController = new Elysia({ prefix: "/orders/:sessId" })
	.use(jwtCheckerPlugin)
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	.guard({
		params: t.Object({
			sessId: uuidObj
		})
	})
	// 3.2 - Add an order to a session
	.post("/", ({ params, db }) => {
		return params
	})
	// 3.1 & 3.2 are authenticated routes
	.guard({
		isAuthenticated: true
	})
	// 3.1 - Get all orders for a given session
	.get("/", ({ params, user, db }) => {
		return params
	})
	// 3.3 - Cancel an order for a session
	.delete("/:orderId", ({ params, user, db }) => {
		return params
	}, {
		params: t.Object({
			orderId: t.Integer()
		})
	})