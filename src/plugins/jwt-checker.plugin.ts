import { Elysia } from 'elysia'
import { jwtConfig } from './jwt-config'
import jwt from '@elysiajs/jwt'

export const jwtCheckerPlugin = new Elysia({
	name: "jwtCheckerPlugin"
})
	.use(jwt(jwtConfig))
	.macro({
		isAuthenticated: {
			async resolve({ jwt, cookie: { auth }, error }) {
				const payload = await jwt.verify(auth.value);
				if (!payload)
					return error(401, "Unauthorized");

				if ((payload.exp && payload.iat) && (payload.exp + payload.iat) <= Date.now() / 1000)
					return error(401, "Token expired");

				return {
					user: {
						id: payload.sub,
						email: payload.email
					}
				}
			}
		}
	})