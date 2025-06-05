import { t, TSchema } from 'elysia'

export const tTimeless = <T extends TSchema>(obj: T) => t.Omit(obj, ["createdAt", "updatedAt", "deletedAt"]);
export type Timeless<T> = Omit<T, "createdAt" | "updatedAt" | "deletedAt">;