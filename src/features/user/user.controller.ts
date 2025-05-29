import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { UUID } from '@utils/types/typebox/uuid'

interface ControllerConfig {
	name?: string
}

export const userController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "userController"
})
	.use(authMiddleware)
	.resolve(({ user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "userController"]: {
				getMe: async () => {
					return user;
				}
			}
		}
	})
	.as("global")