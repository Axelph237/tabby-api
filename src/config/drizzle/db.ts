import 'dotenv/config';
import { drizzle } from 'drizzle-orm/bun-sql';

const db = drizzle({
	connection: process.env.TLS_POSTGRES_DATABASE_URL!,
	casing: "snake_case"
});
