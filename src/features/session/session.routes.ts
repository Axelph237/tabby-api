import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/uuid'
import { sessionController } from '@features/session/session.controller'
import { sessionDetailsTObj } from '@features/session/session.validation'

export const sessionRoutes = new Elysia({ prefix: "/sessions" })
	.use(sessionController({
		name: "sc"
	}))
	.use(authMiddleware)
	// 4.1 - Create new session
	.post("/", async ({ body, sc }) => {
		const session_id = await sc.createSession(body.menu_id, body.session_admins, body.expires_at);
		return { session_id };
	}, {
		isAuthenticated: true,
		body: t.Object({
			menu_id: uuidTObj,
			session_admins: t.Array(uuidTObj),
			expires_at: t.Optional(t.Date())
		}),
		response: t.Object({
			session_id: uuidTObj
		})
	})
	.group(
		"/:sessId",
		{
			params: t.Object({
				sessId: uuidTObj
			})
		},
		app => app
			// 4.2 - Close session
			.delete("/", ({  }) => {
				return "STUB ROUTE"
			}, {
				isAuthenticated: true
			})
			// 4.3 - Get session public details
			.get("/", ({ params, sc }) => {
				return sc.getSessionDetails(params.sessId);
			}, {
				response: sessionDetailsTObj
			})
	)

