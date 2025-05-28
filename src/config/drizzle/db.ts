import 'dotenv/config';
import { drizzle } from 'drizzle-orm/bun-sql';
import * as models from "./tables/exports";
import * as authSchema from "./schemas/auth";
import * as publicSchema from "./schemas/public";

const db = drizzle({
	connection: process.env.TLS_POSTGRES_DATABASE_URL!,
	casing: "snake_case",
	schema: {...models, ...authSchema, ...publicSchema}
});

export default db;
