import { Elysia } from 'elysia'
import { GoogleAuthRoutes } from '@features/auth/providers/google-auth.routes'

export const authRoutes = new Elysia({ prefix: "/auth" })
	.use(GoogleAuthRoutes)