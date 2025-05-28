import { uuid } from 'drizzle-orm/pg-core'
import { usersTable } from '@config/drizzle/tables/users.table'

export const user = () => uuid().references(() => usersTable.id);
