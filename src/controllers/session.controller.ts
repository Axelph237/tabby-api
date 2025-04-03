import { Elysia, t } from 'elysia'
import { PgsqlService } from '../services/psql.service'
import { uuidObj } from '../+types/schema'

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
			menu_id: uuidObj,
			session_admins: t.Array(uuidObj),
			end_time: t.Date()
		})
	})
	.delete("/:sessId", ({ params, db }) => {
		return params
	}, {
		params: t.Object({
			sessId: uuidObj
		})
	})