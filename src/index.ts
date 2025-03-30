import { Elysia } from 'elysia'
import {ServiceError} from "./+types/errors";
import {ApiController} from "./controllers/api.controller";

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
	.use(ApiController)
	.get('/', () => 'Hello Elysia')
	.listen(port)

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
