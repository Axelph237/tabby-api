import { uuid } from 'drizzle-orm/pg-core'
import { users } from '@config/drizzle/tables/users.model'

export const user = () => uuid().references(() => users.id);
