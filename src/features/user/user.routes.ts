import { Elysia, t } from 'elysia'

/**
 * @deprecated - Use other controllers for a better alternative
 */
export const UserRoutes = new Elysia({ prefix: "/users/:userId" })
