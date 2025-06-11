import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/typebox/uuid'
import { sessionDetailsTObj } from '@features/session/session.validation'
import SessionRepository, { tNewSession } from './session.repository'
import { asUser } from '@config/drizzle/query-wrappers'

export const sessionRoutes = new Elysia({ prefix: "/sessions" })
	.use(authMiddleware)
	.decorate("sessionRepo", new SessionRepository())
	// 4.1 - Create new session
	.post("/", async ({ body, sessionRepo, user }) => 
		asUser(user?.id, sessionRepo.create(body)), 
		{
			isAuthenticated: true,
			body: tNewSession
		})
	.group("/:sessId", { params: t.Object({ sessId: uuidTObj }) }, app => app
			// 4.2 - Close session
			.delete("/", async ({ params, sessionRepo, user }) => {
				await asUser(user?.id, sessionRepo.remove(params.sessId))
				return { message: "Successfully deleted session" }
				}, {
					isAuthenticated: true
				})
			// 4.3 - Get session public details
			.get("/", ({ params, sessionRepo, user }) => 
				asUser(user?.id, sessionRepo.get(params.sessId)))
	)

