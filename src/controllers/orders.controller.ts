import { Elysia, t } from 'elysia'
import { uuidObj } from '../+types/schema'
import { PgsqlService } from '../services/psql.service'

export const OrdersController = new Elysia({ prefix: "/orders" })
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	.group("/:sessId", {
		params: t.Object({
			sessId: uuidObj,
		})
	}, app =>
		app
			.get("/", ({ params, db }) => {
				return params
			})
			.post("/", ({ params, db }) => {
				return params
			})
			.delete("/:orderId", ({ params, db }) => {
				return params
			}, {
				params: t.Object({
					orderId: t.Integer()
				})
			})
	)