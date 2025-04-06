import { Elysia, t } from 'elysia'
import { auth } from '@middlewares/auth'
import { Value } from '@sinclair/typebox/value'
import { ServiceError } from '@utils/types/serviceError'
import { db } from '@config/db'
import { UUID } from '@utils/types/uuid'
import { SessionDetails, sessionDetailsObj } from './session.validation'

interface ControllerConfig {
	name?: string
}

export const sessionController = (init?: ControllerConfig) => new Elysia({
	name: init?.name ?? "sessionController"
})
	.use(auth)
	.use(db({ name: "sessionControllerPool" }))
	.resolve({ as: "scoped" }, ({ pool, user }) => {
		const userId = user?.id ?? null;

		return {
			[init?.name ?? "sessionController"]: {
				/**
				 * 4.3 - Get session details.
				 * @param sessionId - The session to get.
				 */
				getSessionDetails: async (
					sessionId: UUID
				): Promise<SessionDetails> => {
					try {
						const [result] = await pool`
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
