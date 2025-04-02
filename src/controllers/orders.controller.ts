import { Elysia, t } from 'elysia'
import { uuidObject } from '../+types/schema'
import { PGService } from '../services/postgres.service'

export const OrdersController = new Elysia({ prefix: "/orders" })
	.derive(() => {
		return {
			db: PGService.getInstance()
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