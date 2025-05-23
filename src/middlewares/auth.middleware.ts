import { Elysia } from 'elysia'
// import jwt, { JWTOption } from '@elysiajs/jwt'
import { UUID } from '@utils/types/uuid'
import { jwtPlugin } from '@config/jwt'

// const jwtConfig: JWTOption = {
// 	name: "jwt",
// 	secret: process.env.JWT_SECRET!,
// 	iss: "auth.tabby",
// 	aud: "client.tabby"
// }

export const authMiddleware = new Elysia({
	name: "auth"
})
	.use(jwtPlugin)
	.derive(async ({ jwt, cookie: { auth } }) => {
		const payload = await jwt.verify(auth.value);
		return {
			payload,
			user: payload ? {
				id: payload.sub as UUID,
				email: payload.email
			} : undefined
		}
	})
	.macro({
		isAuthenticated: {
			beforeHandle({ payload, error }) {
				if (!payload)
					return error(401, "Unauthorized");

				if ((payload.exp && payload.iat) && (payload.exp + payload.iat) <= Date.now() / 1000)
					return error(401, "Token expired");

				if (!payload.sub)
					return error(404, "User not found");
			}
		}
	})
	.as("plugin")