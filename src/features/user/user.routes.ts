import { Elysia } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import UserRepository from './user.repository'
import { asUser } from '@config/drizzle/query-wrappers'
import { usersTable } from '@config/drizzle/tables/users.table'

export const userRoutes = new Elysia({ prefix: "/user" })
	.use(authMiddleware)
	.decorate("userRepo", new UserRepository())
	.get("/me", async ({ userRepo, user, error }) => {
		// Technically authorization was verified, but user's credentials were not found -> 404
		if (!user)
			return error(404, "User not found.");

		const result = await asUser<{ email: string }>(
			user.id, 
			userRepo.get(user.id, { email: usersTable.email })
		);

		// Ensure that resultRows exists
		if (!result.rows)
			return error(404, "User not found in database.");

		const [ firstEntry ] = result.rows;
		return { email: firstEntry.email }
	}, {
		isAuthenticated: true
	})