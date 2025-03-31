import { Elysia } from "elysia";
import { oauth2 } from "elysia-oauth2";
import { dbConnectionUri } from '../database'
import { SQL } from 'bun'

export const AuthController = new Elysia()
	.derive(() => {
		return {
			pool: new SQL(dbConnectionUri)
		}
	})
	.use(
		oauth2({
			Google: [
				process.env.GOOGLE_CLIENT_ID!,
				process.env.GOOGLE_CLIENT_SECRET!,
				process.env.ORIGIN + "/auth/google/callback",
			],
		})
	)
	.get("/auth/google", async ({ oauth2, redirect }) => {
		const url = oauth2.createURL("Google", ["email"]);
		url.searchParams.set("access_type", "offline");

		return redirect(url.href);
	})
	.get("/auth/google/callback", async ({ oauth2 }) => {
		const tokens = await oauth2.authorize("Google");

		const accessToken = tokens.accessToken();

		// send request to API with token
		console.log({
			data: {
				access_token: tokens.accessToken(),
				expires_in: tokens.accessTokenExpiresInSeconds(),
				scope: tokens.scopes(),
				token_type: tokens.tokenType(),
				id_token: tokens.idToken()
			}
		});
	})