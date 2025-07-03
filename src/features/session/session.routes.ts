import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { uuidTObj } from '@utils/types/typebox/uuid'
import { sessionDetailsTObj } from '@features/session/session.validation'
import SessionRepository, { tNewSession, Session } from './session.repository'
import { asGuest, asUser, queryOne } from '@config/drizzle/query-wrappers'
import { eq } from 'drizzle-orm'
import { sessionsTable } from '@config/drizzle/tables/sessions.table'

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
	.get("/", async ({ body, sessionRepo, user, query }) => {
		const q = sessionRepo.index();
		if (query.menuId) {
			q.where(eq(sessionsTable.menuId, query.menuId))
		}
		return asUser(user?.id, q);
	},
		{
			isAuthenticated: true,
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
			.get("/", async ({ params, sessionRepo }) => {
				return sessionRepo._getWithMenu(params.sessId)
			})
	)

