import { Elysia, t } from 'elysia'
import { uuidObject } from '../+types/schema'
import { PgsqlService } from '../services/postgres.service'

export const OrdersController = new Elysia({ prefix: "/orders" })
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	.group("/:sessId", {
		params: t.Object({
			sessId: uuidObject,
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