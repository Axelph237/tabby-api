import { Elysia, t } from 'elysia'
import { PgsqlService } from '../services/psql.service'
import { uuidObject } from '../+types/schema'

export const SessionController = new Elysia({ prefix: "/sessions" })
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	.post("/", ({ body, db }) => {
		return body
	}, {
		body: t.Object({
			menu_id: uuidObject,
			session_admins: t.Array(uuidObject),
			end_time: t.Date()
		})
	})
	.delete("/:sessId", ({ params, db }) => {
		return params
	}, {
		params: t.Object({
			sessId: uuidObject
		})
	})