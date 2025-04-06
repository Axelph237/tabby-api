import { Elysia, t } from 'elysia'
import { auth } from '@middlewares/auth'
import { uuidObj } from '@utils/types/uuid'
import { sessionController } from '@features/session/session.controller'

export const sessionRoutes = new Elysia({ prefix: "/sessions" })
	.use(sessionController({
		name: "sc"
	}))
	.use(auth)
	.guard({
		isAuthenticated: true
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