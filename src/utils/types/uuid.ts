import { Static, t } from 'elysia'

export const uuidObj = t.String({ format: 'uuid' })
export type UUID = Static<typeof uuidObj>