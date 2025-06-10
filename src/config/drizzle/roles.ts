import { pgRole } from "drizzle-orm/pg-core";

export const anonRole = pgRole('anon', { createRole: false, createDb: false, inherit: false });