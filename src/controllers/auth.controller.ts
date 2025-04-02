import { Elysia, t } from "elysia";
import { oauth2 } from "elysia-oauth2";
import { dbConnectionUri } from '../database'
import { randomUUIDv7, sql, SQL } from 'bun'
import jwt from '@elysiajs/jwt'

export const AuthController = new Elysia()
	.use(jwt({
		name: "jwt",
		secret: process.env.JWT_SECRET!
	}))
	.use(
		oauth2({
			Google: [
				process.env.GOOGLE_CLIENT_ID!,
				process.env.GOOGLE_CLIENT_SECRET!,
				process.env.ORIGIN + "/auth/google/callback",
			],
		})
	)
	.derive(() => {
		return {
			pool: new SQL(dbConnectionUri)
		}
	})
	.get("/auth/google", async ({ oauth2, redirect }) => {
		const url = oauth2.createURL("Google", ["email"]);
		url.searchParams.set("access_type", "offline");

		return redirect(url.href);
	})
	.get("/auth/google/callback", async ({ oauth2, jwt, pool, cookie: { auth }, params }) => {
		const tokens = await oauth2.authorize("Google");

		const accessToken = tokens.accessToken();
		const scopes = tokens.hasScopes() ? tokens.scopes() : null;

		// Validate scopes
		if (scopes &&
			(!scopes.includes("https://www.googleapis.com/auth/userinfo.email") || !scopes.includes("openid"))) {
			throw new Error("Required scopes missing.");
		}

		// Get user data
		const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`, {
			method: "GET"
		})
		if (!response.ok) throw new Error("Failed to get user data.");
		const userInfo = await response.json();

		// Create user and account
		try {
			await pool.begin(async tx => {
				const [ row ] = await tx`SELECT id FROM auth.user WHERE email = ${userInfo.email};`;

				const userId = row?.id ?? randomUUIDv7();
				const user = {
					id: userId,
					name: "New User",
					email: userInfo.email,
					email_verified: userInfo.email_verified,
					image: userInfo.picture
				}
				await tx`INSERT INTO auth.user ${sql(user)} 
				ON CONFLICT (id) DO UPDATE SET
				    email = ${user.email},
					email_verified = ${user.email_verified},
					image = ${user.image},
					updated_at = now();`;

				const account = {
					id: randomUUIDv7(),
					user_id: userId,
					provider_id: "Google",
					access_token: accessToken,
					refresh_token: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
					access_token_expires_at: tokens.accessTokenExpiresAt(),
					scope: tokens.hasScopes() ? tokens.scopes().join(" ") : null,
					id_token: tokens.idToken()
				}
				await tx`INSERT INTO auth.account ${sql(account)} 
				ON CONFLICT (user_id, provider_id) DO UPDATE SET
					access_token = ${accessToken},
				    refresh_token = ${account.refresh_token},
				    access_token_expires_at = ${account.access_token_expires_at},
				    scope = ${account.scope},
				    id_token = ${account.id_token},
				    updated_at = now();`
			})
		}
		catch (e) {
			console.log(e);
			throw new Error("Failed to authenticate user: " + e);
		}

		const value = await jwt.sign();


		// send request to API with token
	})