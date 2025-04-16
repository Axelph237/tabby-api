import {Static, t} from "elysia"
import { uuidTObj } from '@utils/types/uuid'

export const userTObj = t.Object({
	id: uuidTObj,
	name: t.String(),
	email: t.String(),
	email_verified: t.Boolean(),
	image: t.Nullable(t.String({ format: "uri" })),
	created_at: t.Date(),
	updated_at: t.Date()
});
export type User = Static<typeof userTObj>;

export const accountTObj = t.Object({
	id: uuidTObj,
	user_id: uuidTObj,
	provider_id: t.String(),
	access_token: t.Nullable(t.String()),
	refresh_token: t.Nullable(t.String()),
	access_token_expires_at: t.Nullable(t.Date()),
	refresh_token_expires_at: t.Nullable(t.Date()),
	scope: t.Nullable(t.String()),
	id_token: t.Nullable(t.String()),
	created_at: t.Date(),
	updated_at: t.Date()
});
export type Account = Static<typeof accountTObj>;