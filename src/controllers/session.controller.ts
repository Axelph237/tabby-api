import { Elysia, t } from 'elysia'
import { PgsqlService } from '../services/psql.service'
import { uuidObj } from '../+types/schema'
import { jwtCheckerPlugin } from '../plugins/jwt-checker.plugin'

export const SessionController = new Elysia({ prefix: "/sessions" })
	.use(jwtCheckerPlugin)
	.guard({
		isAuthenticated: true
	})
	.derive(() => {
		return {
			db: PgsqlService.getInstance()
		}
	})
	// 4.1
	.post("/", ({ body, user, db }) => {
		return body
	}, {
		body: t.Object({
			menu_id: uuidObj,
			session_admins: t.Array(uuidObj),
			end_time: t.Date()
		})
	})
	// 4.2
	.delete("/:sessId", ({ params, user, db }) => {
		return params
	}, {
		params: t.Object({
			sessId: uuidObj
		})
	})