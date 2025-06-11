import { Elysia } from 'elysia'
import { GoogleAuthRoutes } from '@features/auth/providers/google-auth.routes'
import AccountRepository from './accounts.repository'

export const authSetup = new Elysia()
	.decorate(() => ({
		loginCallback: process.env.LOGIN_CALLBACK ?? "http://localhost:5173/auth/callback",
		accountRepo: new AccountRepository()
	}))

export const authRoutes = new Elysia({ prefix: "/auth" })
	.use(GoogleAuthRoutes)