import { JWTOption } from '@elysiajs/jwt'

export const jwtConfig: JWTOption = {
	name: "jwt",
	secret: process.env.JWT_SECRET!,
	iss: "auth.tabby",
	aud: "client.tabby"
}