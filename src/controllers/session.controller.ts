import { Elysia, t } from 'elysia'
import { PGService } from '../services/postgres.service'
import { uuidObject } from '../+types/schema'

export const SessionController = new Elysia({ prefix: "/sessions" })
	.derive(() => {
		return {
			db: PGService.getInstance()
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