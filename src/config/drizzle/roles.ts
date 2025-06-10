import { pgRole } from "drizzle-orm/pg-core";

// For any unauthorized requests
export const guestRole = pgRole('guest', { createRole: false, createDb: false, inherit: false });

// For any authorized requests
export const authRole = pgRole('authorized', { createRole: false, createDb: false, inherit: false });