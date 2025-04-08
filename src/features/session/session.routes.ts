import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/authMiddleware'
import { uuidObj } from '@utils/types/uuid'
import { sessionController } from '@features/session/session.controller'

export const sessionRoutes = new Elysia({ prefix: "/sessions" })
	.use(sessionController({
		name: "sc"
	}))
	.use(authMiddleware)
	.guard({
		isAuthenticated: true
	})
	// 4.1 - Create new session
	.post("/", async ({ body, sc }) => {
		const session_id = await sc.createSession(body.menu_id, body.session_admins, body.expires_at);
		return { session_id };
	}, {
		body: t.Object({
			menu_id: uuidObj,
			session_admins: t.Array(uuidObj),
			expires_at: t.Date()
		}),
		response: t.Object({
			session_id: uuidObj
		})
	})
	.group(
		"/:sessId",
		{
			params: t.Object({
				sessId: uuidObj
			})
		},
		app => app
			// 4.2 - Close session
			.delete("/:sessId", ({  }) => {
				return "STUB ROUTE"
			})
			// 4.3 - Get session public details
			.get("/:sessId", ({ params, sc }) => {
				return sc.getSessionDetails(params.sessId);
			})
	)

