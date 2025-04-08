import {Static, t} from "elysia"
import { uuidObj } from '@utils/types/uuid'

export const userObj = t.Object({
	id: uuidObj,
	name: t.String(),
	email: t.String(),
	email_verified: t.Boolean(),
	image: t.Nullable(t.String({ format: "uri" })),
	created_at: t.Date(),
	updated_at: t.Date()
});
export type User = Static<typeof userObj>;

export const accountObj = t.Object({
	id: uuidObj,
	user_id: uuidObj,
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
export type Account = Static<typeof accountObj>;