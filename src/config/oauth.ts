import { oauth2 } from 'elysia-oauth2'

export const oauthPlugin = oauth2({
	Google: [
		process.env.GOOGLE_CLIENT_ID!,
		process.env.GOOGLE_CLIENT_SECRET!,
		process.env.ORIGIN + "/auth/google/callback",
	]
})