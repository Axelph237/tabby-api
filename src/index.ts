import { Elysia } from 'elysia'
import {ServiceError} from "./+types/errors";
import { MenusController } from './controllers/menus.controller'
import { UsersController } from './controllers/users.controller'

const port = process.env.PORT || 3000

const app = new Elysia()
	.error({
		SERVICE: ServiceError
	})
	.onError(({ code, error }) => {
		switch (code) {
			case "SERVICE":
				return new Response(error.toString(), { status: 500 });
			case "VALIDATION":
				return new Response(error.message, { status: 401 });
		}
	})
	.use(MenusController)
	.use(UsersController)
	.get('/', () => 'Hello Elysia')
	.listen(port)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
