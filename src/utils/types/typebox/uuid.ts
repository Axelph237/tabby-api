import { Static, t } from 'elysia'

export const uuidTObj = t.String({ format: 'uuid' })
export type UUID = Static<typeof uuidTObj>