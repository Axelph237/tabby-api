import { Elysia } from 'elysia'
import {ServiceError} from "./+types/errors";
import { AuthController } from './controllers/auth.controller'

const port = process.env.PORT || 3000

const app = new Elysia()
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
	.use(AuthController)
	.get('/', () => 'Hello Elysia')
	.listen(port)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
