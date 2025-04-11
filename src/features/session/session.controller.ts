import { Elysia, t } from 'elysia'
import { authMiddleware } from '@middlewares/auth.middleware'
import { Value } from '@sinclair/typebox/value'
import { ServiceError } from '@utils/types/serviceError'
import { UUID } from '@utils/types/uuid'
import { SessionDetails, sessionDetailsObj } from './session.validation'
import { sql } from 'bun'

interface ControllerConfig {
	name?: string
}

export const sessionController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "sessionController"
})
	.use(authMiddleware)
	.resolve(({ user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "sessionController"]: {
				createSession: async (
					menuId: UUID,
					admins: UUID[],
					expiresAt?: Date
				): Promise<UUID> => {
					try {
						if (userId && !admins.includes(userId))
							admins.push(userId);

						return await sql.begin(async tx => {
							const [session] = await tx`
								WITH valid_menu AS (
								    SELECT id
								    FROM public.menus
								    WHERE created_by = ${userId}
								)
								INSERT INTO public.sessions (menu_id, expires_at)
								VALUES (${menuId}, ${expiresAt ?? null})
								RETURNING id;`;

							console.log("Session id:", session.id)

							await tx`
								INSERT INTO public.session_admins ${sql(
									admins.map(id => ({ user_id: id, session_id: session.id }))
								)};`;

							return session.id;
						})
					}
					catch (e) {
						throw new ServiceError("Failed to create session.", e);
					}
				},

				/**
				 * 4.3 - Get session details.
				 * @param sessionId - The session to get.
				 */
				getSessionDetails: async (
					sessionId: UUID
				): Promise<SessionDetails> => {
					try {
						const [result] = await sql`
							SELECT * FROM public.get_session_details(${sessionId});`;
						Value.Assert(sessionDetailsObj, result);
						return result;
					}
					catch (e) {
						throw new ServiceError("Failed to get session.", e);
					}
				}
			}
		}
	})
	.as("plugin")
