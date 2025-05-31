import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './drizzle',
	schema: ['./src/**/*.table.ts'],
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.TLS_POSTGRES_DATABASE_URL!,
	},
	casing: "snake_case",
});
