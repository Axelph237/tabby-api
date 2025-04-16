import { Elysia } from 'elysia'
import { sql, SQL } from 'bun'

const pgUser = process.env.PG_USER ?? 'postgres'
const pgPassword = process.env.PG_PASSWORD ?? 'postgres'
const pgHost = process.env.PG_HOST ?? 'localhost:5532'
const pgDatabase = process.env.PG_DATABASE ?? 'postgres'
const dbConnectionUri = `postgresql://${pgUser}:${pgPassword}@${pgHost}/${pgDatabase}?sslmode=require`;

interface DBConfig {
	name?: string
}

export const db = async (init?: DBConfig) => new Elysia({
	name: init?.name ?? "db",
})
	.decorate('db', new SQL())
