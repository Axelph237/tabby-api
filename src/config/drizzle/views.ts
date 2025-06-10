import { sql } from "drizzle-orm";

export const currentUser = sql`current_setting('tabby.transaction.current_user', TRUE)::uuid`;