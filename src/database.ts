const pgUser = process.env.PG_USER ?? 'postgres'
const pgPassword = process.env.PG_PASSWORD ?? 'postgres'
const pgHost = process.env.PG_HOST ?? 'localhost:5532'
const pgDatabase = process.env.PG_DATABASE ?? 'postgres'

export const dbConnectionUri = `postgresql://${pgUser}:${pgPassword}@${pgHost}/${pgDatabase}?sslmode=require`