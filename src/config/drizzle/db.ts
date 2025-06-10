import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as models from "./tables/exports";
import * as schemas from "./schemas";
import * as roles from "./roles"

const sqlClient = neon(process.env.TLS_POSTGRES_DATABASE_URL!);
const db = drizzle({
	client: sqlClient,
	casing: "snake_case",
	schema: {...models, ...schemas, ...roles},
	logger: true
});
export default db;