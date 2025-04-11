import { Elysia } from 'elysia'
import { randomUUIDv7, sql } from 'bun'
import { UUID } from '@utils/types/uuid'
import { ServiceError } from '@utils/types/serviceError'
import { User } from '@features/auth/auth.validation'
import { ParsedOAuth2Tokens } from '@utils/parseOAuthTokens'

interface ControllerConfig {
	name?: string
}

export const authController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "authController"
})
	.decorate('loginCallback', process.env.LOGIN_CALLBACK ?? "http://localhost:5173/auth/callback")
	.resolve(() => {
		return {
			[init?.name ?? "authController"]: {
				storeOAuthAccount: async (
					tokens: ParsedOAuth2Tokens,
					userInfo: Omit<User, "id" | "created_at" | "updated_at">,
					provider: string
				): Promise<UUID> => {
					// Create user and account
					try {
						return await sql.begin(async tx => {
							// Get user id
							const [ row ] = await tx`SELECT id FROM auth.user WHERE email = ${userInfo.email};`;

							const userId = row?.id ?? randomUUIDv7();
							// Format user and account objects
							const user = {
								id: userId,
								...userInfo
							}
							const account = {
								id: randomUUIDv7(),
								user_id: userId,
								provider_id: provider,
								...tokens
							}

							await tx`INSERT INTO auth.user ${sql(user)} 
				    			ON CONFLICT (id) DO UPDATE SET
				    			    email = ${user.email},
								    email_verified = ${user.email_verified},
								    image = ${user.image},
								    updated_at = now();`;

							await tx`INSERT INTO auth.account ${sql(account)} 
				    			ON CONFLICT (user_id, provider_id) DO UPDATE SET
								    access_token = ${account.access_token},
				    			    refresh_token = ${account.refresh_token},
				    			    access_token_expires_at = ${account.access_token_expires_at},
				    			    scope = ${account.scope},
				    			    id_token = ${account.id_token},
				    			    updated_at = now();`;

							return userId;
						})
					}
					catch (e) {
						console.log(e);
						throw new ServiceError("Failed to store oauth account.", e);
					}
				}
			}
		}
	})
	.as("plugin")