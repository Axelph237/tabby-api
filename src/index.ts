import { Elysia } from 'elysia'
import {ServiceError} from "@utils/types/serviceError";
import { itemRoutes } from '@features/item/item.routes'
import { orderRoutes } from '@features/order/order.routes'
import { menuRoutes } from '@features/menu/menu.routes'
import { sessionRoutes } from '@features/session/session.routes'
import { userRoutes } from '@features/user/user.routes'
import { authRoutes } from '@features/auth/auth.routes'
import { loggerMiddleware } from '@middlewares/logger.middleware'
import { corsPlugin } from '@config/cors'
// import { auth } from '@middlewares/auth'

const port = process.env.PORT || 3000

const app = new Elysia()
	.use(corsPlugin)
	.use(loggerMiddleware)
	.error({
		SERVICE: ServiceError
	})
	.onError(({ code, error }) => {
		console.log(error);
		switch (code) {
			case "SERVICE":
				return new Response(error.toString(), { status: 500 });
			case "VALIDATION":
				return new Response(error.message, { status: 401 });
		}
	})
	.get('/', () => 'Hello Elysia')
	.use(itemRoutes)
	.use(menuRoutes)
	.use(orderRoutes)
	.use(sessionRoutes)
	.use(userRoutes)
	.use(authRoutes)
	.listen(port)

// console.log(
// 	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
// )
