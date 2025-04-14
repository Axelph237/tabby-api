import { Elysia, t } from 'elysia'
import { userController } from '@features/user/user.controller'

export const userRoutes = new Elysia({ prefix: "/user" })
	.use(userController({
		name: "uc"
	}))
	// .use(authMiddleware)
	.get("/me", async ({ uc }) => {
		const email = await uc.getMe();
		return {
			email
		}
	})